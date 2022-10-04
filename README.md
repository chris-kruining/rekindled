# Rekindled
Beautiful errors for Remix, both in browser and console.

This project is inspired by php's ignition. 
I am personally in love with the idea of solutions. 
In many occasions during development you run in to errors that are not always obvious as to what might be the cause. 
However, from a library author's perspective it might be. But with today's mechanisms you probably end up googling the error message, maybe prefixed by the libraries name. 
You then often end up on stack overflow, a github issue, or maybe an FAQ.

Solutions try to resolve this. Where you propose a solution -if applicable- at the same time you throw the error. 

## Freatures:

- Works without JS (uses JS solely for progressively enhancing the experience)
- development environment only, in production the children passed into `Rekindled` are rendered
- Solutions (is a to-do)
- Pretty and interactive console and terminal experiences (as a to-do)

## Installation

`npm i @kruining/rekindled`



## Usage

Setting up Rekindled is as easy as: 

### 1. Wrap your error boundary's element.
`/app/routes/root.tsx`
```tsx
import { Rekindled } from '@kruining/rekindled';

export function ErrorBoundary({ error }: { error: Error })
{
    return <Rekindled traceEndpoint="/error" error={error}>
        <h1>Whoops!</h1>
        <h2>We ran into an error: {error.message}</h2>
        <p>{error.stack}</p>
    </Rekindled>
}
```

### 2. Set up an endpoint for getting detailed information

`/app/routes/error.tsx`

```ts
import { LoaderFunction } from 'remix';
import { rekindle } from '@kruining/rekindled/api.server.js';

export const loader: LoaderFunction = async ({ request }) => {
    const error = JSON.parse(decodeURIComponent(new URL(request.url).searchParams.get('error')!));

    return rekindle(error);
};
```

### 3. Use the error page!

![preview][1]

### Options
| option        | type      | default value           | Description                                                            |
|---------------|-----------|-------------------------|------------------------------------------------------------------------|
| traceEndpoint | `string`  | none, field is required | Route to the endpoint where you have loader that returns `rekindle`    |
| error         | `Error`   | none, field is required | The error to be handled by Rekindled                                   |
| shown         | `boolean` | `false`                 | This option handles if the Rekindled dialog should be shown by default |



# TODO

- [x] Create/Fix intial component for Remix
- [ ] Add feature: Terminal "rendering" for nicer errors
- [ ] Add feature: Dark theme
- [ ] Add feature: Implement container queries so that Rekindled can run wel as a nested element somewhere on a page
- [ ] Add feature: Implement `Solution`



[1]: preview.png
