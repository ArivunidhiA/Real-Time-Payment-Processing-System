import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - Page Not Found</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">404</h1>
          <p className="text-white/70 mb-6">This page could not be found.</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300 underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    </>
  );
}

