"use client";

import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Client, Sale, SaleItem } from '@/types';
import { formatCurrency } from '@/lib/utils';

type SaleSubmitData = Omit<Sale, 'id' | 'saleNumber' | 'date'>;

interface SaleFormProps {
  sale?: Sale | null;
  clients: Client[];
  onSubmit: (saleData: SaleSubmitData) => Promise<void>;
  onClose: () => void;
}

interface SaleFormItem extends Omit<SaleItem, 'id'> {}

export const SaleForm = ({ sale, clients, onSubmit, onClose }: SaleFormProps) => {
  const [clientId, setClientId] = useState(sale?.clientId || '');
  const [items, setItems] = useState<SaleFormItem[]>(
    sale?.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      price: item.price,
    })) || [{ description: '', quantity: 0, price: 0 }]
  );
  const [loading, setLoading] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const grandTotal = subtotal;

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 0, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof SaleFormItem, value: string | number) => {
    const newItems = [...items];
    if (field === 'description' && typeof value === 'string') {
      newItems[index].description = value;
    } else if (field === 'quantity') {
      newItems[index].quantity = Number(value) || 0;
    } else if (field === 'price') {
      newItems[index].price = typeof value === 'string' 
        ? parseInt(value.replace(/\D/g, '')) || 0 
        : value;
    }
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      alert('Por favor seleccione un cliente');
      return;
    }
    if (items.some(i => !i.description)) {
      alert('Todos los productos deben tener una descripción');
      return;
    }

    setLoading(true);
    try {
      const client = clients.find(c => c.id === clientId);
      await onSubmit({
        clientId,
        clientName: client?.name || 'Desconocido',
        items: items.map((item, index) => ({ ...item, id: index.toString() })),
        subtotal,
        discount: 0,
        grandTotal,
        status: sale?.status || 'Pendiente',
        paid: sale?.paid || false,
        paymentDate: sale?.paymentDate || null
      });
    } catch {
      alert('Error al guardar la venta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-primary">
            {sale ? `Editar Venta ${sale.saleNumber}` : 'Nueva Venta'}
          </h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted ml-1">Seleccionar Cliente</label>
            <select
              className="form-control py-2.5"
              required
              value={clientId}
              onChange={e => setClientId(e.target.value)}
            >
              <option value="">Seleccione un cliente...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-main">Detalle de Productos</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="btn btn-ghost text-primary border-primary/20 py-1.5 h-9 text-xs"
              >
                <Plus className="w-3 h-3" />
                Añadir Producto
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_80px_150px_130px_40px] gap-3 items-end p-3 bg-background rounded-2xl border border-[#e8eeee]">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase ml-1">Descripción</label>
                    <input
                      type="text"
                      className="form-control py-2 h-10 text-sm"
                      placeholder="Nombre del producto"
                      value={item.description}
                      onChange={e => updateItem(index, 'description', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase ml-1">Cant.</label>
                    <input
                      type="number"
                      className="form-control py-2 h-10 text-sm text-center"
                      min="0"
                      value={item.quantity}
                      onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase ml-1">Precio Unit.</label>
                    <input
                      type="text"
                      className="form-control py-2 h-10 text-sm"
                      value={(item.price ?? 0).toLocaleString()}
                      onChange={e => updateItem(index, 'price', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase ml-1">Total</label>
                    <div className="bg-white border border-[#e8eeee] rounded-xl px-3 py-2 text-sm font-bold text-primary flex items-center h-10">
                      {formatCurrency(item.quantity * item.price)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-2 text-danger hover:bg-red-50 rounded-xl transition-colors h-10 flex items-center justify-center"
                    disabled={items.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#e8eeee] flex justify-between items-end">
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn btn-ghost px-6 h-11 text-sm">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary px-6 h-11 text-sm" disabled={loading}>
                {loading ? 'Guardando...' : sale ? 'Actualizar Venta' : 'Registrar Venta'}
              </button>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted uppercase font-bold tracking-wider">Total</span>
              <div className="text-2xl font-bold text-primary leading-none mt-1">{formatCurrency(grandTotal)}</div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
