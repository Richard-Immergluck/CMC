// Create Checkout Session
const stripe = await loadStripe(process.env.STRIPE_PUBLISHABLE_KEY)

const handler = async (req, res) => {
  const { items } = req.body

  if (req.method === 'POST') {
  const session = await stripe.checkout.sessions.create({
    lineItems: items.map(item => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: item.title
        },
        unit_amount: item.price,
        quantity: 1
      }
    })),
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_URL}/cart?success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/cart?canceled`
  })} else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}
