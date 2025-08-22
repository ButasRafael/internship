import { AppProviders } from '@/app/providers'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'

export default function App() {
    return (
        <AppProviders>
            <RouterProvider router={router} />
        </AppProviders>
    )
}
