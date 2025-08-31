import { SignupForm } from "@/components/auth/signup-form";
import { Suspense } from "react";

function SignupPageContent() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <SignupForm />
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <SignupPageContent />
        </Suspense>
    )
}
