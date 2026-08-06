import { useRoutes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { routes } from '@/routes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

export default function App() {
  const element = useRoutes(routes)

  return (
    <QueryClientProvider client={queryClient}>
      {element}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#0F172A',
            color: '#fff',
            borderRadius: '12px',
          },
        }}
      />
    </QueryClientProvider>
  )
}
