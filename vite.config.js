export default {
    base: './',
    server: {
        host: true
    },
    build: {
        assetsInlineLimit: 0,
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
            output: {
                manualChunks: undefined
            }
        }
    }
} 