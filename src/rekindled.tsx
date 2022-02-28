import React, { useEffect, useState } from 'react';
import { Link } from '@remix-run/react';
import { Frame, Meta } from './api.js';

const style = `
.rekindled {
    display: grid;
    gap: 3em;
    padding: 1em;
    background-color: #eee;
    color: #333;
    font-size: 1rem;
    overflow-y: auto;
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
    grid: 100% / 40% minmax(0, 1fr);
    block-size: 70vh;
    background-color: #fff;
    border-radius: .5em;
    box-shadow: 0 0 1em #0004;
    overflow: clip;
}

.rekindled > main > nav {
    display: grid;
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

.rekindled > main > .preview > .frame > header {
    text-align: right;
    font-weight: 900;
    font-size: 1.2em;
    padding: .5em;
}

.rekindled > main > .preview > .frame > .code {
    display: flex;
    flex-flow: column;
    white-space: pre-wrap;
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
    font-weight: bold;
    background-color: hsla(10 75% 50% / .25);
}

.rekindled > main > .preview > .frame > .code code.current::before {
    background-color: hsla(10 75% 50% / .25);
}

.rekindled > footer {
    display: grid;
    border-radius: .5em;
    box-shadow: 0 0 1em #0004;
    padding: 2em;
    background: hsla(10 75% 50% / .25);
}

.rekindled > footer > strong {
    display: block;
    font-size: 1.25em;
}
`;

export function Rekindled({ traceEndpoint, error }: { traceEndpoint: string, error: Error })
{
    const [ meta, setMeta ] = useState<Meta>({});
    const [ trace, setTrace ] = useState<Frame[]>([]);

    useEffect(() => {
        fetch(traceEndpoint, { body: JSON.stringify(error) }).then(r => r.json()).then(r => {
            const { meta, trace } = r;

            console.log(meta, trace);

            // setMeta(meta);
            // setTrace(trace);
        });
    }, [ error ]);

    // const meta: Meta = {};
    // const trace: Frame[] = [];

    return <>
        <style dangerouslySetInnerHTML={{ __html: style }}/>

        <div className="rekindled">
            <nav>
                {Object.entries(meta).map(([ app, { version, docs } ]) =>
                    <span>{app} {version} <a target="_blank" href={docs}>docs</a></span>
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
                    {trace.map((frame: Frame, i) =>
                        <Link to={`#frame-${i}`} replace={true} key={i}>
                            <p>
                                <strong>{frame.file}</strong> on line <span>{frame.line}</span>
                            </p>

                            <span>{frame.name}</span>
                        </Link>
                    )}
                </nav>

                <div className="preview">
                    {trace.map((frame: Frame, i: number) =>
                        <div className="frame" id={`frame-${i}`}>
                            <header>{frame.file}</header>

                            <pre key={i} className="code">
                            {frame.code.split('\n').map((line, i) => {
                                const currentLine = frame.start! + i

                                return <code data-line={currentLine} className={currentLine === frame.line ? 'current' : ''}>{line}</code>;
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