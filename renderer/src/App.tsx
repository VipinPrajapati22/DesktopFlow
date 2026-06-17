import React, { useEffect } from 'react';
import { useDashboardStore } from './state/useDashboardStore';

export default function App() {
    const { selectedDate, hydrateForDate } = useDashboardStore();

    useEffect(() => {
        hydrateForDate(selectedDate);
    }, [selectedDate, hydrateForDate]);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <div style={{ padding: 24 }}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>
                    Phase 1 scaffolding
                </div>
                <div style={{ opacity: 0.75, fontSize: 13 }}>
                    Renderer initialized. Selected date: {selectedDate}
                </div>
            </div>
        </div>
    );
}


