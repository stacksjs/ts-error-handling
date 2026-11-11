import { dts } from '@dtsx/bun'

const result = await Bun.build({
  entrypoints: ['src/index.ts'],
  outdir: './dist',
  plugins: [dts()],
})

if (!result.success) throw new AggregateError(result.logs, 'Error-handling package build failed')
