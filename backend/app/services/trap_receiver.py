import asyncio
from pysnmp.entity import engine, config
from pysnmp.carrier.asyncio.dgram import udp
from pysnmp.entity.rfc3413 import ntfrcv
from sqlmodel import Session, select
from datetime import datetime
import threading
from loguru import logger

from app.core.database import engine as db_engine
from app.models.snmp_trap import SnmpTrap
from app.models.service import Service

class TrapReceiver:
    def __init__(self, port=1162):
        self.port = port
        self.snmpEngine = engine.SnmpEngine()
        self.transportDispatcher = None

    def start(self):
        """
        Starts the SNMP Trap Receiver.
        Note: Pysnmp's async integration can be tricky with FastAPI's loop.
        For simplicity and stability, we might run this in a separate thread or use the existing loop carefully.
        Here we try to attach to the running loop if compatible, or just use basic threading for the IO loop if simpler.
        
        Actually, pysnmp 4.4.12+ supports asyncio directly.
        """
        try:
            # Setup transport - UDP/IPv4
            config.addTransport(
                self.snmpEngine,
                udp.domainName,
                udp.UdpTransport().openServerMode(('0.0.0.0', self.port))
            )

            # Setup community - v1/v2c
            # Accept 'public' and others. In a real app, this should be configurable.
            config.addV1System(self.snmpEngine, 'my-area', 'public')

            # Callback for notification
            def cbFun(snmpEngine, stateReference, contextEngineId, contextName,
                      varBinds, cbCtx):
                try:
                    transportDomain, transportAddress = snmpEngine.msgAndPduDsp.getTransportInfo(stateReference)
                    source_ip = transportAddress[0]
                    
                    logger.info(f"Received Trap from {source_ip}")

                    # Parse VarBinds
                    # Usually the second varbind (index 1) is the Trap OID if standard v2 trap
                    # But we'll just dump formatted strings for now
                    
                    oid_val_str = []
                    primary_oid = ""
                    primary_val = ""
                    
                    for name, val in varBinds:
                        logger.debug(f"{name.prettyPrint()} = {val.prettyPrint()}")
                        oid_val_str.append(f"{name.prettyPrint()} = {val.prettyPrint()}")
                        
                        # Heuristic: First OID that looks like an event OID
                        if not primary_oid:
                             primary_oid = name.prettyPrint()
                             primary_val = val.prettyPrint()

                    # Save to DB
                    with Session(db_engine) as session:
                        # Try to link to a service
                        service = session.exec(select(Service).where(Service.ip == source_ip)).first()
                        service_id = service.id if service else None
                        
                        trap = SnmpTrap(
                            service_id=service_id,
                            source_ip=source_ip,
                            oid=primary_oid,
                            value=primary_val,
                            varbinds_json="; ".join(oid_val_str),
                            timestamp=datetime.utcnow()
                        )
                        session.add(trap)
                        session.commit()
                        
                except Exception as e:
                    logger.error(f"Error processing trap: {e}")

            # Register callback
            ntfrcv.NotificationReceiver(self.snmpEngine, cbFun)

            # Run the dispatcher
            self.snmpEngine.transportDispatcher.jobStarted(1)

            # We need to run the dispatcher's loop. 
            # If we block here, we block FastAPI. So run in a thread.
            
            def run_loop():
                try:
                    logger.info(f"SNMP Trap Receiver listening on port {self.port}")
                    self.snmpEngine.transportDispatcher.runDispatcher()
                except Exception as e:
                    logger.error(f"SNMP Dispatcher error: {e}")
                finally:
                    self.snmpEngine.transportDispatcher.closeDispatcher()

            self.thread = threading.Thread(target=run_loop, daemon=True)
            self.thread.start()

        except Exception as e:
            logger.error(f"Failed to start SNMP Trap Receiver: {e}")

    def stop(self):
        if self.snmpEngine.transportDispatcher:
            self.snmpEngine.transportDispatcher.closeDispatcher()
            
trap_receiver = TrapReceiver()
