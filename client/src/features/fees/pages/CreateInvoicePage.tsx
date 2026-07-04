import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateInvoice, useFeeCategories } from '../useFees';
import { formatAmount } from '../format';
import { useStudents } from '@/features/students/useStudents';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const schema = z.object({
  studentId: z.string().uuid('Select a student'),
  title: z.string().min(1, 'Title is required'),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        categoryId: z.string().optional(),
        description: z.string().min(1, 'Required'),
        amount: z.coerce.number().int('Whole number'),
        quantity: z.coerce.number().int().min(1),
      }),
    )
    .min(1),
  discount: z.coerce.number().int().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

const emptyItem = { categoryId: '', description: '', amount: 0, quantity: 1 };

export function CreateInvoicePage() {
  const navigate = useNavigate();
  const students = useStudents({ limit: 100, status: 'ACTIVE' });
  const categories = useFeeCategories();
  const createInvoice = useCreateInvoice();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { items: [emptyItem] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchedItems = watch('items');
  const subtotal = (watchedItems ?? []).reduce(
    (acc, i) => acc + (Number(i.amount) || 0) * (Number(i.quantity) || 0),
    0,
  );
  const discount = Math.max(0, Number(watch('discount')) || 0);
  const total = Math.max(0, subtotal - discount);

  const onSubmit = handleSubmit(async (values) => {
    const invoice = await createInvoice.mutateAsync({
      studentId: values.studentId,
      title: values.title,
      dueDate: values.dueDate || undefined,
      notes: values.notes?.trim() || undefined,
      items: values.items.map((i) => ({
        categoryId: i.categoryId || undefined,
        description: i.description,
        amount: i.amount,
        quantity: i.quantity,
      })),
      discount: values.discount || undefined,
    });
    navigate(`/fees/invoices/${invoice.id}`, { replace: true });
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/fees/invoices" className="text-sm text-brand-600">
          ← Back to invoices
        </Link>
        <h1 className="mt-2 text-2xl font-bold">New invoice</h1>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <Card className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Student" {...register('studentId')} error={errors.studentId?.message}>
              <option value="">Select student</option>
              {students.data?.items.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.admissionNo})
                </option>
              ))}
            </Select>
            <TextField label="Title" placeholder="Term 1 Fees" {...register('title')} error={errors.title?.message} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Due date (optional)" type="date" {...register('dueDate')} />
            <TextField label="Notes (optional)" {...register('notes')} />
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Line items</h2>
            <Button type="button" variant="secondary" onClick={() => append(emptyItem)}>
              + Add item
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 items-start gap-2">
                <div className="col-span-3">
                  <Select aria-label="Category" {...register(`items.${index}.categoryId`)}>
                    <option value="">No category</option>
                    {categories.data?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-4">
                  <TextField
                    aria-label="Description"
                    placeholder="Description"
                    {...register(`items.${index}.description`)}
                    error={errors.items?.[index]?.description?.message}
                  />
                </div>
                <div className="col-span-2">
                  <TextField aria-label="Amount" type="number" placeholder="Amount" {...register(`items.${index}.amount`)} />
                </div>
                <div className="col-span-2">
                  <TextField aria-label="Quantity" type="number" placeholder="Qty" {...register(`items.${index}.quantity`)} />
                </div>
                <div className="col-span-1 pt-1">
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" onClick={() => remove(index)}>
                      ✕
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
            <div className="w-40">
              <TextField
                label="Discount / scholarship"
                type="number"
                min={0}
                {...register('discount')}
                error={errors.discount?.message}
              />
            </div>
            <div className="text-right text-sm">
              {discount > 0 && (
                <>
                  <div className="text-slate-500">Subtotal: <span className="tabular-nums">{formatAmount(subtotal)}</span></div>
                  <div className="text-slate-500">Discount: <span className="tabular-nums">− {formatAmount(discount)}</span></div>
                </>
              )}
              <div>Total: <span className="font-semibold tabular-nums">{formatAmount(total)}</span></div>
            </div>
          </div>
        </Card>

        {createInvoice.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {getApiErrorMessage(createInvoice.error)}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/fees/invoices')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createInvoice.isPending}>
            Create invoice
          </Button>
        </div>
      </form>
    </div>
  );
}
