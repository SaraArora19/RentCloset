// LoueStyle – In-memory database
// Admin credentials: admin@louestyle.com / admin123

const db = {
  users: [
    {
      id: 0,
      name: 'Admin',
      email: 'admin@louestyle.com',
      phone: '9999999999',
      password: 'PLACEHOLDER', // re-hashed on boot in auth.js
      isAdmin: true,
      createdAt: new Date().toISOString(),
    },
  ],

  orders: [],
  wishlist: [],

  // Delivery partners
  deliveryPartners: [
    { id: 1, name: 'Ravi Kumar',    phone: '9876543210', area: 'North Zone', active: true, assignedOrders: 0 },
    { id: 2, name: 'Priya Sharma',  phone: '9876543211', area: 'South Zone', active: true, assignedOrders: 0 },
    { id: 3, name: 'Mohan Das',     phone: '9876543212', area: 'East Zone',  active: true, assignedOrders: 0 },
  ],
  nextDeliveryPartnerId: 4,

  products: [
    { id: 1, name: 'Beige Vintage Coat',      category: 'Women',       pricePerDay: 500, description: 'A timeless beige vintage coat with a double-breasted silhouette. Perfect for autumn events and casual outings. Made from premium wool blend fabric.', image: 'images/coat1.jpg',  sizes: ['XS','S','M','L','XL'], available: true },
    { id: 2, name: 'Beige Trench Coat',       category: 'Men',         pricePerDay: 450, description: 'Classic beige trench coat with belt detail. A wardrobe staple that works for both formal and casual settings. Lined with soft fabric for comfort.',    image: 'images/coat2.jpg',  sizes: ['S','M','L','XL','XXL'], available: true },
    { id: 3, name: 'Vintage Tweed Blazer',    category: 'Women',       pricePerDay: 450, description: 'Sophisticated tweed blazer with structured fit. Features classic check pattern and button detail. Perfect for office or evening wear.',              image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80', sizes: ['XS','S','M','L'], available: true },
    { id: 4, name: 'Classic Wool Coat',       category: 'Men',         pricePerDay: 550, description: 'Premium wool overcoat in deep charcoal. Clean minimalist design with hidden buttons. A must-have for sophisticated winter dressing.',                  image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=600&q=80', sizes: ['S','M','L','XL'], available: true },
    { id: 5, name: 'Floral Summer Dress',     category: 'Women',       pricePerDay: 300, description: 'Breezy floral midi dress perfect for summer occasions. Light and airy fabric with flattering A-line silhouette.',                                      image: 'images/dress.jpg',  sizes: ['XS','S','M','L'], available: true },
    { id: 6, name: 'Kids Party Dress',        category: 'Kids',        pricePerDay: 200, description: 'Adorable party dress for little ones. Tulle skirt with satin bodice. Perfect for birthdays and celebrations.',                                         image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600&q=80', sizes: ['3-4Y','5-6Y','7-8Y','9-10Y'], available: true },
    { id: 7, name: 'Pearl Handbag',           category: 'Accessories', pricePerDay: 250, description: 'Elegant cream pearl-embellished handbag. Compact yet spacious clutch style perfect for evening events.',                                               image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80', sizes: ['One Size'], available: true },
    { id: 8, name: 'Structured Leather Tote', category: 'Accessories', pricePerDay: 350, description: 'Premium structured tote bag in caramel leather. Spacious interior with multiple pockets.',                                                              image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&q=80', sizes: ['One Size'], available: true },
  ],
  nextProductId: 9,
  nextUserId: 1,
};

module.exports = db;
