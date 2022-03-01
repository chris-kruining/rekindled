import { readFileSync, statSync } from 'fs';
import remixPackage from '@remix-run/react/package.json';
import ErrorStackParser from 'error-stack-parser';
import Stackframe from 'stackframe';
import path from 'path';
import { SourceMap } from 'module';

export type MetaItem = { version: string, docs: string };
export type Meta = Record<string, MetaItem>

export type Frame = {
    name: string,
    code: string,
    anonymous: boolean,
    file: string,
    line: number,
    start: number|undefined,
    end: number|undefined,
    column: number
};

export function getTrace(error: Error): Frame[]
{
    const frames: Stackframe[] = ErrorStackParser.parse(error);

    return frames.map<Frame>((f: StackFrame) => {
        let code: string = '';
        let content: string|Buffer;
        let start: number|undefined;
        let end: number|undefined;

        if(f.fileName !== undefined)
        {
            if(f.fileName.startsWith('http'))
            {
                const filePath = path.join(process.cwd(), 'public', new URL(f.fileName).pathname);
                const bundleFileContent = getFile(filePath)!;

                const key = "//# sourceMappingURL=";
                const dataURl = 'data:application/json;base64,';

                const startUrl = bundleFileContent.lastIndexOf(key) + key.length;
                const endUrl = bundleFileContent.indexOf("\n", startUrl);
                const url = bundleFileContent.slice(startUrl, endUrl).toString();

                const sourcemapSource = url.startsWith(dataURl)
                    ? Buffer.from(url.slice(dataURl.length), "base64url")
                    : getFile(path.join(process.cwd(), "public", url));

                const sourcemap = new SourceMap(JSON.parse(sourcemapSource!.toString()));
                const entry = sourcemap.findEntry(f.lineNumber!, f.columnNumber!);

                // BUG(Chris Kruining) the sourcemap's line if off by one, not sure if it is my fault or the libs, or remix'.
                f.setFileName(path.resolve(filePath, '../' + entry.originalSource));
                f.setLineNumber(entry.originalLine);
                f.setColumnNumber(entry.originalColumn);

                content = sourcemap.payload.sourcesContent[sourcemap.payload.sources.indexOf(entry.originalSource)];
            }
            else
            {
                f.setFileName(
                    f.fileName.match(/^.*?((?:[A-Z]:)?(?:[\/\\]?[a-zA-Z0-9_.@-]+)+)$/)?.[1] ?? f.fileName
                );

                content = getFile(f.fileName)!;
            }


            [ code, start, end ] = getCodeSnippet(content ?? '', f.lineNumber ?? 0);
        }

        return {
            name: f.functionName ?? '<anonymous>',
            file: f.fileName ?? '',
            anonymous: f.functionName === undefined,
            line: f.lineNumber ?? -1,
            column: f.columnNumber ?? -1,
            code,
            start,
            end,
        };
    });
}

function getCodeSnippet(fileContent: Buffer|string, line: number): [ string, number, number ]
{
    if(fileContent instanceof Buffer)
    {
        fileContent = fileContent.toString();
    }

    const lines = fileContent.split('\n');
    const start = Math.max(line - 10, 0);
    const end = Math.min(line + 10, lines.length)

    return [
        lines.slice(start, end).join('\n'),
        start,
        end,
    ];
}

const files: Map<string, Buffer> = new Map;
function getFile(path: string): Buffer|undefined
{
    if(files.has(path) === false)
    {
        let header;

        try
        {
            header = statSync(path);
        }
        catch (e: any)
        {
            if(e.code !== 'ENOENT')
            {
                throw e;
            }

            // File is not found
            return;
        }

        if(header.isFile() === false)
        {
            return;
        }

        files.set(path, readFileSync(path));
    }

    return files.get(path);
}

export async function rekindle(error: Error): Promise<{ meta: Meta, trace: Frame[] }>
{
    return process.env.NODE_ENV === 'development'
        ? {
            meta: {
                NodeJS: { version: process.version, docs: 'https://nodejs.org/api/' },
                Remix: { version: remixPackage.version, docs: 'https://remix.run/docs' },
            },
            trace: getTrace(error),
        }
        : { meta: {}, trace: [] };
}