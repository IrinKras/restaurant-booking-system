import React, { useState } from 'react';

const BookingForm = () => {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    guests: 2,
    name: '',
    email: '',
    phone: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Submit booking
    console.log('Booking submitted:', formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Направете резервация</h2>
      
      <input
        type="date"
        value={formData.date}
        onChange={(e) => setFormData({...formData, date: e.target.value})}
        required
      />
      
      <input
        type="time"
        value={formData.time}
        onChange={(e) => setFormData({...formData, time: e.target.value})}
        required
      />
      
      <select
        value={formData.guests}
        onChange={(e) => setFormData({...formData, guests: e.target.value})}
      >
        {[1,2,3,4,5,6,7,8].map(n => (
          <option key={n} value={n}>{n} {n === 1 ? 'гост' : 'гости'}</option>
        ))}
      </select>
      
      <input
        type="text"
        placeholder="Име"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
      />
      
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
      />
      
      <button type="submit">Резервирай</button>
    </form>
  );
};

export default BookingForm;
