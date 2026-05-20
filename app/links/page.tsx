"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, ExternalLink } from "lucide-react";
import api from "@/lib/axios";

interface LinktreeSetting {
    logo: string | null;
    page_title: string;
    page_subtitle: string | null;
    background_type: 'color' | 'image';
    background_color: string;
    background_image: string | null;
    page_text_color: string;
    button_bg_color: string;
    button_text_color: string;
    button_border_color: string;
    button_style: 'solid' | 'outline' | 'glass';
}

interface LinktreeLink {
    id: number;
    icon: string;
    custom_icon: string | null;
    label: string;
    url: string;
}

// We use simpleicons for rendering brand icons dynamically

export default function LinktreePage() {
    const [settings, setSettings] = useState<LinktreeSetting | null>(null);
    const [links, setLinks] = useState<LinktreeLink[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Since this is public, we can just GET /linktree
                const res = await api.get('/linktree');
                setSettings(res.data.settings);
                setLinks(res.data.links);
            } catch (error) {
                console.error("Gagal load linktree data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        );
    }

    if (!settings) return <div className="text-center p-10">Data not found.</div>;

    const bgStyle = settings.background_type === 'image' && settings.background_image
        ? { backgroundImage: `url(${settings.background_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { backgroundColor: settings.background_color };

    return (
        <main 
            className="min-h-[100dvh] w-full flex justify-center relative overflow-hidden transition-all duration-500"
            style={bgStyle}
        >
            {/* Animated Gradient Overlay (if color) */}
            {settings.background_type === 'color' && (
                <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-white/10 pointer-events-none" />
            )}
            
            {/* Overlay for image bg (No Blur) */}
            {settings.background_type === 'image' && (
                <div className="absolute inset-0 bg-black/60 pointer-events-none" />
            )}

            <div className="w-full max-w-md px-8 md:px-12 py-22 flex flex-col items-center relative z-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
                
                {/* Logo with Glow */}
                <div className="relative mb-6 group inline-flex justify-center">
                    <div className="absolute -inset-1 bg-white/20 blur-md rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
                    <div className="rounded-2xl overflow-hidden relative shadow-xl">
                        {settings.logo ? (
                            <img 
                                src={settings.logo} 
                                alt={settings.page_title}
                                className="max-w-[200px] max-h-[160px] w-auto h-auto object-contain"
                            />
                        ) : (
                            <div className="w-24 h-24 bg-zinc-900 flex items-center justify-center text-2xl font-black rounded-2xl">
                                {settings.page_title.substring(0, 2)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Profile Title & Subtitle */}
                <h1 className="text-2xl font-black tracking-tight mb-2 text-center drop-shadow-md" style={{ color: settings.page_text_color }}>
                    {settings.page_title}
                </h1>
                {settings.page_subtitle && (
                    <p className="text-sm font-medium mb-10 text-center max-w-[280px]" style={{ color: settings.page_text_color, opacity: 0.8 }}>
                        {settings.page_subtitle}
                    </p>
                )}

                {/* Links Container */}
                <div className="w-full flex flex-col gap-4">
                    {links.map((link, index) => {
                        
                        // Button Style Logic
                        let btnStyleClass = "";
                        let customStyle = {};
                        
                        if (settings.button_style === 'solid') {
                            btnStyleClass = "shadow-lg hover:shadow-xl";
                            customStyle = { 
                                backgroundColor: settings.button_bg_color,
                                color: settings.button_text_color,
                                borderColor: settings.button_border_color,
                                borderWidth: '1px'
                            };
                        } else if (settings.button_style === 'outline') {
                            btnStyleClass = "bg-transparent hover:bg-white/5";
                            customStyle = {
                                color: settings.button_text_color,
                                borderColor: settings.button_border_color,
                                borderWidth: '2px'
                            };
                        } else {
                            // Glassmorphism
                            btnStyleClass = "bg-white/10 backdrop-blur-md hover:bg-white/20";
                            customStyle = {
                                color: settings.button_text_color,
                                borderColor: settings.button_border_color || 'rgba(255,255,255,0.2)',
                                borderWidth: '1px'
                            };
                        }

                        return (
                            <Link 
                                key={link.id}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`
                                    group relative w-full flex items-center px-6 py-4 rounded-xl 
                                    transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02]
                                    overflow-hidden
                                    ${btnStyleClass}
                                `}
                                style={{
                                    ...customStyle,
                                    animationDelay: `${index * 100}ms`
                                }}
                            >
                                {/* Shimmer Effect */}
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                                
                                {/* Icon */}
                                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                                    {link.custom_icon ? (
                                        <div className="w-8 h-8 relative rounded-full overflow-hidden">
                                            <Image src={link.custom_icon} alt={link.label} fill className="object-contain" />
                                        </div>
                                    ) : (
                                        ['globe', 'email', 'phone'].includes(link.icon) ? (
                                            <div className="w-6 h-6 flex items-center justify-center opacity-80" style={{ color: settings.button_text_color }}>
                                                {link.icon === 'globe' && <ExternalLink className="w-5 h-5"/>}
                                                {link.icon === 'email' && <span className="text-lg">✉️</span>}
                                                {link.icon === 'phone' && <span className="text-lg">📞</span>}
                                            </div>
                                        ) : (
                                            <img src={`https://cdn.simpleicons.org/${link.icon === 'twitter' ? 'x' : link.icon}/${settings.button_text_color.replace('#', '')}`} alt={link.label} className="w-6 h-6 object-contain" />
                                        )
                                    )}
                                </div>

                                {/* Label */}
                                <div className="flex-1 text-center font-bold tracking-wide pr-10">
                                    {link.label}
                                </div>
                                
                                {/* Hover Arrow */}
                                <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ExternalLink className="w-5 h-5 opacity-70" />
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
            
            <style jsx global>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </main>
    )
}
