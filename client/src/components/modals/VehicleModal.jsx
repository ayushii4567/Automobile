import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { Car, Save } from 'lucide-react';

export default function VehicleModal({ isOpen, onClose, onSave, vehicle }) {
  const initialForm = {
    brand: '',
    model: '',
    year: 2024,
    category: 'Supercar',
    color: '',
    fuel: 'Petrol',
    transmission: 'Automatic',
    engine: '',
    horsepower: '',
    mileage: '',
    price: '',
    vin: '',
    stock: 1,
    status: 'Available',
    image: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80'
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (vehicle) {
      setForm(vehicle);
    } else {
      setForm(initialForm);
    }
  }, [vehicle, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      price: Number(form.price),
      year: Number(form.year),
      horsepower: Number(form.horsepower || 0),
      mileage: Number(form.mileage || 0),
      stock: Number(form.stock || 1)
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vehicle ? 'Edit Vehicle Details' : 'Add New Vehicle to Inventory'}
      subtitle="Enter vehicle specifications, pricing, and stock details"
      maxWidth="700px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Manufacturer / Brand</label>
            <input
              type="text"
              placeholder="e.g. Toyota, Honda, Hyundai, BMW"
              className="form-input"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Model Name</label>
            <input
              type="text"
              placeholder="e.g. Fortuner, City, Creta, 3 Series"
              className="form-input"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Model Year</label>
            <input
              type="number"
              className="form-input"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Vehicle Category</label>
            <select
              className="form-select"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="SUV">SUV</option>
              <option value="Sedan">Sedan</option>
              <option value="Hatchback">Hatchback</option>
              <option value="Coupe">Coupe</option>
              <option value="Luxury / Exotic">Luxury / Exotic</option>
              <option value="Electric EV">Electric EV</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Ex-Showroom Price (₹ INR)</label>
            <input
              type="number"
              placeholder="e.g. 2150000"
              className="form-input"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Exterior Color</label>
            <input
              type="text"
              placeholder="e.g. Guards Red, Nardo Grey"
              className="form-input"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Fuel Type</label>
            <select
              className="form-select"
              value={form.fuel}
              onChange={(e) => setForm({ ...form, fuel: e.target.value })}
            >
              <option value="Petrol">Petrol</option>
              <option value="Electric">Electric</option>
              <option value="Hybrid / Mild">Hybrid / Mild</option>
              <option value="Diesel">Diesel</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Horsepower (HP)</label>
            <input
              type="number"
              placeholder="e.g. 518"
              className="form-input"
              value={form.horsepower}
              onChange={(e) => setForm({ ...form, horsepower: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">VIN (Chassis Number)</label>
            <input
              type="text"
              placeholder="17-character VIN"
              className="form-input"
              value={form.vin}
              onChange={(e) => setForm({ ...form, vin: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Inventory Status</label>
            <select
              className="form-select"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="Available">Available</option>
              <option value="Reserved">Reserved</option>
              <option value="Sold">Sold</option>
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">High-Resolution Image URL</label>
            <input
              type="url"
              placeholder="https://..."
              className="form-input"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              required
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Save size={16} />
            <span>{vehicle ? 'Update Vehicle' : 'Save Vehicle'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
