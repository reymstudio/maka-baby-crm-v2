"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from './Sidebar';
import { redirect } from 'next/navigation';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-primary rounded-full opacity-20" />
                    <span className="text-muted font-medium">Cargando...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="min-h-screen flex bg-background">
            <Sidebar />
            <main className="flex-1 lg:ml-72 p-6 pt-20 lg:py-10 lg:px-10 transition-all duration-300 print:m-0 print:p-0">
                {children}
            </main>
        </div>
    );
}
