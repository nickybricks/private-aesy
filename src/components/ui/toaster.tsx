import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastTitle, ToastViewport } from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}

      {/* Hier jetzt mit className für unten rechts */}
      <ToastViewport className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col p-4 gap-2 md:max-w-[420px]" />
    </>
  );
}
