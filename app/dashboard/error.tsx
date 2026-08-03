"use client";
export default function DashboardError({reset}:{reset:()=>void}){return <div className="finder-empty"><strong>We couldn’t load this view.</strong><p>Check the database connection and try again.</p><button className="finder-button finder-button--primary" onClick={reset}>Try again</button></div>}
