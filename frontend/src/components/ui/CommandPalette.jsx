import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/auth';
import { useUIStore } from '../../store/ui';
import {
    LayoutDashboard,
    Server,
    Activity,
    Settings,
    LogOut,
    Moon,
    Sun,
    Monitor,
    Terminal,
    Laptop
} from 'lucide-react';

const CommandPalette = () => {
    const [open, setOpen] = useState(false);
    const [, setLocation] = useLocation();
    const { t } = useTranslation();
    const logout = useAuthStore((state) => state.logout);
    const { setTheme } = useUIStore();

    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = (command) => {
        setOpen(false);
        command();
    };

    return (
        <Command.Dialog open={open} onOpenChange={setOpen} label="Global Command Menu" className="cmdk-dialog">
            <div className="cmdk-overlay" onClick={() => setOpen(false)} />
            <div className="cmdk-content">
                <Command.Input placeholder="Type a command or search..." />
                <Command.List>
                    <Command.Empty>No results found.</Command.Empty>

                    <Command.Group heading="Navigation">
                        <Command.Item onSelect={() => runCommand(() => setLocation('/'))}>
                            <LayoutDashboard size={16} />
                            <span>Dashboard</span>
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => setLocation('/services'))}>
                            <Server size={16} />
                            <span>Services</span>
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => setLocation('/monitoring'))}>
                            <Activity size={16} />
                            <span>Monitoring</span>
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => setLocation('/settings'))}>
                            <Settings size={16} />
                            <span>Settings</span>
                        </Command.Item>
                    </Command.Group>

                    <Command.Group heading="Tools">
                        <Command.Item onSelect={() => runCommand(() => setLocation('/ssh'))}>
                            <Terminal size={16} />
                            <span>SSH Terminal</span>
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => setLocation('/rdp'))}>
                            <Monitor size={16} />
                            <span>Remote Desktop</span>
                        </Command.Item>
                    </Command.Group>

                    <Command.Group heading="Theme">
                        <Command.Item onSelect={() => runCommand(() => setTheme('light'))}>
                            <Sun size={16} />
                            <span>Light Mode</span>
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => setTheme('dark'))}>
                            <Moon size={16} />
                            <span>Dark Mode</span>
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => setTheme('system'))}>
                            <Laptop size={16} />
                            <span>System Theme</span>
                        </Command.Item>
                    </Command.Group>

                    <Command.Group heading="Account">
                        <Command.Item onSelect={() => runCommand(logout)}>
                            <LogOut size={16} />
                            <span>Logout</span>
                        </Command.Item>
                    </Command.Group>
                </Command.List>
            </div>
        </Command.Dialog>
    );
};

export default CommandPalette;
