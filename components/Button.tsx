import { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export default function Button({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }: ButtonProps){
  const baseStyles = "px-5 py-2.5 rounded-lg font-medium transition-all duration-300 flex items-center justify-center tracking-wide font-sans text-sm"
  
  const variants = {
    primary: "bg-electric text-black hover:bg-electric/90 hover:shadow-[0_0_15px_rgba(0,229,255,0.5)] hover:scale-[1.02]",
    secondary: "bg-neon text-white hover:bg-neon/90 hover:shadow-[0_0_15px_rgba(179,0,255,0.5)] hover:scale-[1.02]",
    outline: "border border-white/20 text-minimal-white hover:border-electric hover:text-electric hover:bg-electric/5"
  }

  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-none' : ''

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      type={type}
      className={`${baseStyles} ${variants[variant]} ${disabledStyles} ${className}`}
    >
      {children}
    </button>
  )
}

