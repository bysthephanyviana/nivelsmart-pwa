import React from 'react';
import clsx from 'clsx';
import { Loader } from 'lucide-react';

const VARIANTS = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-transparent",
    ghost: "bg-transparent text-slate-600 hover:text-blue-600 hover:bg-slate-50",
};

const SIZES = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
};

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className,
    loading,
    disabled,
    icon: Icon,
    ...props
}) => {
    return (
        <button
            disabled={disabled || loading}
            className={clsx(
                "inline-flex items-center justify-center font-medium transition-all rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
                VARIANTS[variant],
                SIZES[size],
                className
            )}
            {...props}
        >
            {loading ? (
                <Loader className="w-5 h-5 animate-spin mr-2" />
            ) : Icon ? (
                <Icon size={20} className={children ? "mr-2" : ""} />
            ) : null}
            {children}
        </button>
    );
};

export default Button;
