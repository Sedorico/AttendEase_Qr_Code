"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, QrCode, Users, Shield, ArrowRight, Sparkles, Clock, CheckCircle2, Zap, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/employee");
      }
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Background Effects - 51Talk inspired warm yellow/cream tones */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/30 blur-[100px] animate-pulse-glow" />
          <div className="absolute top-1/2 -left-40 h-[400px] w-[400px] rounded-full bg-accent/20 blur-[80px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-primary/20 blur-[60px]" />
        </div>

        {/* Navigation */}
        <motion.nav 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-12"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">AttendQR</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.push("/scanner")} className="text-muted-foreground hover:text-foreground">
              Scanner Kiosk
            </Button>
            <Button variant="ghost" onClick={() => router.push("/login")} className="text-muted-foreground hover:text-foreground">
              Sign In
            </Button>
            <Button onClick={() => router.push("/register")} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 ml-2">
              Get Started
            </Button>
          </div>
        </motion.nav>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 lg:px-12 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-4 py-2 text-sm font-medium text-accent mb-6"
              >
                <Sparkles className="h-4 w-4" />
                Enterprise-Grade Solution
              </motion.div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-tight">
                Smart QR-Based
                <span className="block mt-2 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                  Attendance System
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
                Revolutionize your workforce management with our cutting-edge QR code attendance
                system. Real-time tracking, instant insights, and seamless employee experience.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  onClick={() => router.push("/register")} 
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/30 h-12 px-8 text-base"
                >
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => router.push("/scanner")}
                  className="h-12 px-8 text-base border-2 hover:bg-muted"
                >
                  Try Scanner Demo
                </Button>
              </div>

              {/* Stats */}
              <div className="mt-14 grid grid-cols-3 gap-8">
                {[
                  { value: "99.9%", label: "Uptime", icon: Zap },
                  { value: "50ms", label: "Scan Speed", icon: Clock },
                  { value: "256-bit", label: "Encryption", icon: Shield },
                ].map((stat, index) => (
                  <motion.div 
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="text-center sm:text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <stat.icon className="h-4 w-4 text-primary" />
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Hero Visual - Enhanced 3D Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative perspective-1000"
            >
              <div className="relative mx-auto w-full max-w-md">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-accent/40 rounded-[3rem] blur-3xl opacity-50" />
                
                {/* Phone Mockup */}
                <div className="relative rounded-[3rem] bg-card border-8 border-foreground/10 p-4 shadow-2xl card-3d">
                  <div className="absolute left-1/2 top-4 h-6 w-24 -translate-x-1/2 rounded-full bg-foreground/10" />
                  <div className="mt-8 rounded-2xl bg-gradient-to-b from-muted/50 to-muted p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                        <QrCode className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Your QR Code</p>
                        <p className="text-sm text-muted-foreground">Ready to scan</p>
                      </div>
                    </div>
                    <div className="aspect-square rounded-2xl bg-card p-6 flex items-center justify-center shadow-inner border border-border">
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 49 }).map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 + i * 0.02 }}
                            className={`h-3 w-3 rounded-sm ${
                              [0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48].includes(i) 
                                ? "bg-foreground" 
                                : Math.random() > 0.5 ? "bg-foreground" : "bg-transparent"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-success/10 border border-success/20">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <span className="text-sm font-semibold text-success flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          Active
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                        <span className="text-sm text-muted-foreground">Expires in</span>
                        <span className="text-sm font-mono font-semibold text-foreground">28s</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Cards */}
                <motion.div
                  initial={{ opacity: 0, x: -40, y: 20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ delay: 0.9, type: "spring" }}
                  className="absolute -left-16 top-1/4 rounded-2xl bg-card/90 backdrop-blur-xl border border-border p-4 shadow-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-success/20 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Secure</p>
                      <p className="text-xs text-muted-foreground">End-to-end encrypted</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 40, y: -20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ delay: 1.1, type: "spring" }}
                  className="absolute -right-12 bottom-1/3 rounded-2xl bg-card/90 backdrop-blur-xl border border-border p-4 shadow-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">1,234</p>
                      <p className="text-xs text-muted-foreground">Active users</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="relative py-24 bg-gradient-to-b from-muted/30 to-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
              Everything You Need
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete attendance management solution designed for modern enterprises.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: QrCode,
                title: "Dynamic QR Codes",
                description:
                  "Time-limited, encrypted QR codes that regenerate automatically for maximum security.",
                color: "primary",
              },
              {
                icon: Users,
                title: "Employee Mobile App",
                description:
                  "Intuitive mobile interface for employees to view their QR codes and attendance history.",
                color: "accent",
              },
              {
                icon: BarChart3,
                title: "Admin Dashboard",
                description:
                  "Comprehensive dashboard with real-time analytics, reports, and employee management.",
                color: "success",
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description:
                  "256-bit encryption, secure authentication, and role-based access control.",
                color: "warning",
              },
              {
                icon: Zap,
                title: "Real-time Updates",
                description:
                  "Instant attendance notifications and live dashboard updates via WebSocket.",
                color: "accent",
              },
              {
                icon: ArrowRight,
                title: "Easy Integration",
                description:
                  "RESTful API and webhooks for seamless integration with your existing systems.",
                color: "primary",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative rounded-3xl bg-card border border-border p-8 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 card-3d"
              >
                <div className={`h-14 w-14 rounded-2xl bg-${feature.color}/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-7 w-7 text-${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10" />
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full bg-primary/20 blur-[100px]" />
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative mx-auto max-w-4xl px-6 text-center lg:px-12"
        >
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            Ready to Transform Your Attendance System?
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of companies already using AttendQR for seamless workforce management.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => router.push("/register")} 
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/30 h-14 px-10 text-base"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="h-14 px-10 text-base border-2"
            >
              Contact Sales
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-foreground">AttendQR</span>
            </div>
            <p className="text-sm text-muted-foreground">
              2024 AttendQR. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
