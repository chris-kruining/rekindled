import { SourceMap } from 'module';
import { readFile, stat } from 'fs/promises';
import remixPackage from '@remix-run/react/package.json';

export type MetaItem = { version: string, docs: string };
export type Meta = Record<string, MetaItem>

type FrameProps = Partial<{
    name: string,
    code: string,
    anonymous: '<anonymous>',
    file: string,
    line: string|number,
    start: number|undefined,
    end: number|undefined,
    column: string|number
}>;

export class Frame
{
    readonly name: string;
    readonly code: string;
    readonly file: string;
    readonly line: number;
    readonly start?: number;
    readonly end?: number;
    readonly column: number;

    constructor({ name, code, anonymous, file, line, start, end, column }: FrameProps)
    {
        this.name = name ?? '';
        this.code = code ?? '';
        this.file = anonymous ?? file ?? '';
        this.line = Number(line ?? '');
        this.start = start;
        this.end = end;
        this.column = Number(column ?? '');
    }

    static from(line: string): Frame|undefined
    {
        const match = line.match(/^\s*at (?<name>[^(]+) \((?:(?<anonymous><anonymous>)|(?<file>.+):(?<line>\d+):(?<column>\d+))\)$/)?.groups;

        return match !== undefined
            ? new Frame(match)
            : undefined;
    }
}

async function getTrace(error: Error): Promise<Frame[]>
{
    const frames: Frame[] = error.stack?.split('\n').slice(1).map(f => Frame.from(f)).filter((f: Frame|undefined): f is Frame => f !== undefined) ?? [];

    return Promise.all(frames.map(async f => {
        if(f.file === '')
        {
            return f;
        }

        const content = await getFile(f.file);

        if(content === undefined || content.includes('//# sourceMappingURL=') === false)
        {
            const [ snippet, start, end ] = getCodeSnippet(content ?? '', f.line);
            return new Frame({ ...f, code: snippet, start, end });
        }

        const key = '//# sourceMappingURL=data:application/json;base64,';
        const startUrl = content.lastIndexOf(key) + key.length;
        const endUrl = content.indexOf('\n', startUrl);
        const sourcemap = new SourceMap(
            JSON.parse(Buffer.from(content.slice(startUrl, endUrl).toString(), 'base64url').toString())
        );

        const entry = sourcemap.findEntry(f.line, f.column);
        const fileContent = sourcemap.payload.sourcesContent[sourcemap.payload.sources.indexOf(entry.originalSource)];
        const [ snippet, start, end ] = getCodeSnippet(fileContent, entry.originalLine);

        return new Frame({
            code: snippet,
            start,
            end,
            file: entry.originalSource,
            line: entry.originalLine,
            column: entry.originalColumn,
        });
    }));
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
async function getFile(path: string): Promise<Buffer|undefined>
{
    if(files.has(path) === false)
    {
        const header = await stat(path);

        if(header.isFile() === false)
        {
            return;
        }

        files.set(path, await readFile(path));
    }

    return files.get(path);
}

export async function loader(request: Request): Promise<{ meta: Meta, trace: Frame[] }>
{
    const { error } = await request.json();

    return {
        meta: {
            NodeJS: { version: process.version, docs: 'https://nodejs.org/api/' },
            Remix: { version: remixPackage.version, docs: 'https://remix.run/docs' },
        },
        trace: await getTrace(error),
    };
}