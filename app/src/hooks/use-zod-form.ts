import { zodResolver } from "@hookform/resolvers/zod";
import type {
  FieldValues,
  Resolver,
  UseFormProps,
  UseFormReturn,
} from "react-hook-form";
import { useForm } from "react-hook-form";
import type { ZodType } from "zod";

/**
 * Hook générique pour brancher un schéma Zod à React Hook Form.
 * @param schema Le schéma Zod à utiliser pour la validation.
 * @param options Options additionnelles pour useForm.
 */
export function useZodForm<TValues extends FieldValues>(
  schema: ZodType<TValues, TValues>,
  options?: Omit<UseFormProps<TValues>, "resolver">,
): UseFormReturn<TValues> {
  return useForm<TValues>({
    resolver: zodResolver(
      schema as unknown as Parameters<typeof zodResolver>[0],
    ) as Resolver<TValues>,
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    ...options,
  });
}
