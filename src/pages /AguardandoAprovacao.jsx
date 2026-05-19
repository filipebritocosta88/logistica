import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Truck, Clock, Sparkles, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AguardandoAprovacao() {
  const { user } = useAuth();

  const handleLogout = () => base44.auth.logout('/login');

  const orbs = [
    { size: 280, x: '-10%', y: '-15%', delay: 0, duration: 8 },
    { size: 200, x: '75%', y: '60%', delay: 2, duration: 10 },
    { size: 150, x: '80%', y: '-5%', delay: 1, duration: 7 },
  ];

  return (
    <div className="min-h-screen pending-bg flex items-center justify-center overflow-hidden relative">
      {/* Animated orbs */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle, hsl(235 85% 60% / 0.12), transparent 70%)`,
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: orb.duration, delay: orb.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`p-${i}`}
          className="absolute w-1 h-1 rounded-full bg-indigo-400/40"
          style={{
            left: `${10 + (i * 8) % 85}%`,
            top: `${15 + (i * 13) % 70}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 3 + (i % 4),
            delay: i * 0.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg"
      >
        {/* Logo / icon */}
        <motion.div
          className="relative mb-8"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
            <Truck className="w-12 h-12 text-white" />
          </div>
          <motion.div
            className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center shadow-lg"
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <Clock className="w-4 h-4 text-white" />
          </motion.div>
          {/* Pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-3xl border-2 border-indigo-400/30"
            animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex items-center gap-2 justify-center mb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-300">LOGISTICA</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 font-grotesk">
            Aguardando Liberação
          </h1>
          <p className="text-indigo-200 text-sm leading-relaxed mb-2">
            Olá{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}! Seu cadastro foi recebido com sucesso.
          </p>
          <p className="text-white/60 text-sm leading-relaxed">
            O administrador irá revisar seu acesso e atribuir o seu perfil em breve.
            Assim que liberado, você poderá acessar o sistema normalmente.
          </p>
        </motion.div>

        {/* Status indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 w-full bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse-ring" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white text-sm font-medium">Conta em análise</p>
              <p className="text-white/50 text-xs">{user?.email || 'Verificando...'}</p>
            </div>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, delay: i * 0.3, repeat: Infinity }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-5 w-full space-y-2"
        >
          {[
            { label: 'Cadastro realizado', done: true },
            { label: 'Aguardando aprovação do admin', done: false, active: true },
            { label: 'Acesso liberado ao sistema', done: false },
          ].map((step, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
              step.active ? 'bg-indigo-500/15 border border-indigo-500/30' :
              step.done ? 'bg-white/5' : 'opacity-40'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                step.done ? 'bg-emerald-500 text-white' :
                step.active ? 'bg-amber-400 text-white' :
                'bg-white/10 text-white/40'
              }`}>
                {step.done ? '✓' : step.active ? '?' : i + 1}
              </div>
              <span className={step.done ? 'text-white/70' : step.active ? 'text-white font-medium' : 'text-white/30'}>
                {step.label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-white/40 hover:text-white/70 hover:bg-white/5 gap-2 text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair da conta
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
