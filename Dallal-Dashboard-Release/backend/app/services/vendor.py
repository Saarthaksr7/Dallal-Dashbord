from mac_vendor_lookup import MacLookup, BaseMacLookup

# Initialize global instance
# Note: In production we might want to update this periodically
BaseMacLookup.cache_path = "mac-vendors.txt" 
mac = MacLookup()

async def lookup_vendor(mac_address: str) -> str:
    try:
        # Sanitize MAC
        clean_mac = mac_address.replace("-", ":").replace(".", ":")
        return mac.lookup_vendor(clean_mac)
    except:
        return None

async def update_vendor_db():
    try:
        print("Updating MAC Vendor DB...")
        mac.update_vendors()
        print("MAC Vendor DB updated.")
    except Exception as e:
        print(f"Failed to update MAC Vendor DB: {e}")
