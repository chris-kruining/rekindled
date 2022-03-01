import React, { PropsWithChildren, useEffect, useState } from 'react';
import { Link, useFetcher } from '@remix-run/react';
import { Meta, Frame, getTrace } from './api.server.js';
import remixPackage from '@remix-run/react/package.json';

const style = `
.rekindled {
    display: grid;
    align-content: start;
    align-items: start;
    gap: 3em;
    padding: 1em;
    background-color: #eee;
    color: #333;
    font-size: 1rem;
    overflow-y: auto;
    isolation: isolate;
    contain: strict;
}

.rekindled > nav > span {
    padding: .25em .5em;
}

.rekindled > nav > span:not(:last-of-type) {
    border-inline-end: 1px solid #0003;
}

.rekindled > header {
    display: grid;
    grid-auto-flow: column;
    background-color: #fff;
    border-radius: .5em;
    box-shadow: 0 0 1em #0004;
    overflow: clip;
}

.rekindled > header > main {
    display: grid;
    align-content: center;
    justify-items: start;
    gap: 1em;
    padding: 1em;
}

.rekindled > header > main > strong {
    padding: .5em;
    border-radius: .5em;
    background-color: #0001;
}

.rekindled > header > main > h1 {
    margin: 0;
}

.rekindled > header > aside {
    display: grid;
    align-items: center;
    justify-items: center;
    background-color: #6ee7b7;
}

.rekindled > main {
    display: grid;
    grid: minmax(0, 40em) / minmax(20em, min(30em, 40%)) minmax(0, 1fr);
    background-color: #fff;
    border-radius: .5em;
    box-shadow: 0 0 1em #0004;
    overflow: clip;
}

.rekindled > main > nav {
    display: grid;
    align-content: start;
    padding-block: 2em;
    overflow-y: auto;
}

.rekindled > main > nav > a {
    display: grid;
    padding: 1em;
    border-block-end: 1px solid #0001;
    text-decoration: none;
    color: inherit;
}

.rekindled > main > nav > a:target {
    background-color: hsla(10 75% 50% / .25);
}

.rekindled > main > .preview {
    display: grid;
    grid-template-columns: 100%;
    grid-auto-flow: row;
    grid-auto-rows: 100%;
    background-color: #00000008;
    overflow: hidden;
    scroll-behavior: auto;
}

.rekindled > main > .preview > .code {
    overflow: auto;
    inline-size: 100%;
    block-size: 100%;
    padding-block: 1em;
}

.rekindled > main > .preview > .frame {
    display: grid;
    padding-inline-end: 1em;
}

.rekindled > main > .preview > .frame > header {
    text-align: right;
    font-weight: 900;
    font-size: 1.2em;
    padding: .5em;
}

.rekindled > main > .preview > .frame > .code {
    display: flex;
    flex-flow: column;
    white-space: pre;
    overflow: auto;
}

.rekindled > main > .preview > .frame > .code code {
    padding-block: .25em;
}

.rekindled > main > .preview > .frame > .code code::before {
    content: attr(data-line);
    display: inline-block;
    inline-size: 2.5em;
    block-size: 100%;
    margin-block: -.25em;
    margin-inline-end: .5em;
    border-inline-end: 1px solid #0002;
    padding: .25em .5em;
    text-align: right;
}

.rekindled > main > .preview > .frame > .code code.current {
    background-color: hsla(10 75% 50% / .25);
}

.rekindled > main > .preview > .frame > .code code.current::before {
    font-weight: 900;
    background-color: hsla(10 75% 50% / .25);
}

.rekindled > footer {
    display: grid;
    border-radius: .5em;
    box-shadow: 0 0 1em #0004;
    padding: 2em;
    background: hsla(10 75% 50% / .25);
    overflow-x: auto;
}

.rekindled > footer > strong {
    display: block;
    font-size: 1.25em;
}
`;

export function Rekindled({ traceEndpoint, error, children }: PropsWithChildren<{ traceEndpoint: string, error: Error }>)
{
    if(process.env.NODE_ENV !== 'development')
    {
        return children;
    }

    const fetcher = useFetcher();
    const [ report, setReport ] = useState<{ meta: Meta, trace: Frame[] }|undefined>(undefined);

    useEffect(() => {
        if(fetcher.state === 'idle' && fetcher.type !== 'done')
        {
            fetcher.load(`${traceEndpoint}?error=${encodeURIComponent(JSON.stringify({ stack: error.stack }))}`);
        }
    }, []);

    if(!report)
    {
        if(typeof window === 'undefined')
        {
            setReport({
                meta: {
                    NodeJS: { version: process.version, docs: 'https://nodejs.org/api/' },
                    Remix: { version: remixPackage.version, docs: 'https://remix.run/docs' },
                },
                trace: getTrace(error),
            });
        }
        else if(fetcher.data)
        {
            setReport(fetcher.data);
        }
    }

    return <>
        <style dangerouslySetInnerHTML={{ __html: style }}/>

        <div className="rekindled">
            <nav>
                {Object.entries(report?.meta ?? {}).map(([ app, { version, docs } ], i: number) =>
                    <span key={i}>{app} {version} <a target="_blank" href={docs}>docs</a></span>
                )}
            </nav>

            <header>
                <main>
                    <strong>{error.name}</strong>

                    <h1>{error.message}</h1>
                </main>

                <aside className="solution">
                    some solution
                </aside>
            </header>

            <main>
                <nav>
                    {report?.trace.map((frame: Frame, i: number) =>
                        <Link to={`#frame-${i}`} replace={true} key={i}>
                            <p>
                                <strong>{frame.file}</strong> on line <span>{frame.line}</span>
                            </p>

                            <span>{frame.name}</span>
                        </Link>
                    )}
                </nav>

                <div className="preview">
                    {report?.trace.map((frame: Frame, i: number) =>
                        <div className="frame" id={`frame-${i}`} key={i}>
                            <header>{frame.file}</header>

                            <pre key={i} className="code">
                                {frame.code.split('\n').map((line: string, i: number) => {
                                    const currentLine = frame.start! + i + 1;

                                    return <code data-line={currentLine} className={currentLine === frame.line ? 'current' : ''} key={i}>{line}</code>;
                                })}
                            </pre>
                        </div>
                    )}
                </div>
            </main>

            <footer>
                <strong>Raw error:</strong>

                <pre>{error.stack}</pre>
            </footer>
        </div>
    </>
}