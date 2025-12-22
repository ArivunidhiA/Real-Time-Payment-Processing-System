import React from 'react';
import Head from 'next/head';

interface ErrorProps {
  statusCode?: number;
}

function Error({ statusCode }: ErrorProps) {
  return (
    <>
      <Head>
        <title>Error {statusCode || 'Unknown'}</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            {statusCode ? `Error ${statusCode}` : 'An error occurred'}
          </h1>
          <p className="text-white/70">
            {statusCode === 404
              ? 'This page could not be found.'
              : 'Something went wrong. Please try again later.'}
          </p>
        </div>
      </div>
    </>
  );
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;

