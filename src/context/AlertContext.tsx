"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Alert from "@/components/ui/alert/Alert";
import { AnimatePresence, motion } from "framer-motion";

type AlertType = "success" | "error" | "warning" | "info";

type AlertData = {
  type: AlertType;
  title: string;
  message: string;
} | null;

type AlertContextType = {
  alert: AlertData;
  showAlert: (data: AlertData) => void;
  hideAlert: () => void;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<AlertData>(null);

  const showAlert = (data: AlertData) => setAlert(data);
  const hideAlert = () => setAlert(null);

  useEffect(() => {
    if (alert) {
      const timeout = setTimeout(() => {
        setAlert(null);
      }, 4000);
      return () => clearTimeout(timeout);
    }
  }, [alert]);

  return (
    <AlertContext.Provider value={{ alert, showAlert, hideAlert }}>
      {children}
      <AnimatePresence>
        {alert && (
          <motion.div
            key={alert.message}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 right-4 z-999999 w-[320px]"
          >
            <Alert
              variant={alert.type}
              title={alert.title}
              message={alert.message}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}
