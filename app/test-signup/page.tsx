"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function TestSignupPage() {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testClientSignup = async () => {
    setLoading(true);
    setResult("Testing client-side signup...");

    try {
      // Test the client-side signup directly
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      console.log("🧪 Environment check:", {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        urlLength: supabaseUrl?.length || 0,
        anonKeyLength: supabaseAnonKey?.length || 0,
      });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      setResult(`Client signup result:
Data: ${JSON.stringify(data, null, 2)}
Error: ${JSON.stringify(error, null, 2)}`);
    } catch (err) {
      setResult(
        `Client signup error: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const testServerSignup = async () => {
    setLoading(true);
    setResult("Testing server-side signup...");

    try {
      const response = await fetch("/api/dev/test-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setResult(`Server signup result (${response.status}):
${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      setResult(
        `Server signup error: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Signup Test Page</h1>

      <div className="space-y-4 mb-6">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <Button
          onClick={testClientSignup}
          disabled={loading}
          className="w-full"
        >
          Test Client-Side Signup
        </Button>

        <Button
          onClick={testServerSignup}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          Test Server-Side Signup
        </Button>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded border">
          <pre className="text-sm whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
}
