"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Lock, Eye, EyeOff, Zap, Mail } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
            const data = await res.json()
            if (res.ok) {
                toast.success("Login realizado com sucesso!")
                router.replace('/')
                router.refresh()
            } else {
                toast.error(data.error || "Senha incorreta")
            }
        } catch {
            toast.error("Erro de conexão")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-4">
            {/* Subtle grid pattern overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIHg9IjMwIiB5PSIzMCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvZz48L3N2Zz4=')] opacity-50" />

            <Card className="w-full max-w-sm shadow-2xl border-0 bg-white/95 backdrop-blur-sm relative z-10">
                <CardHeader className="text-center space-y-3 pb-2">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#0d9488] shadow-lg">
                        <Zap className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold text-[#0f172a]">Trontec AI</CardTitle>
                        <CardDescription className="text-sm mt-1">
                            Digite a senha para acessar a plataforma
                        </CardDescription>
                    </div>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4 pb-4">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="email"
                                placeholder="E-mail de acesso"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-9 h-11 text-sm"
                                autoFocus
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Senha de acesso"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-9 pr-10 h-11 text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3">
                        <Button
                            className="w-full h-11 bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 text-white font-medium"
                            disabled={loading || !password || !email}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Verificando...
                                </span>
                            ) : "Entrar"}
                        </Button>
                        <p className="text-[11px] text-muted-foreground text-center">
                            Acesso restrito a administradores
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
