document.addEventListener('DOMContentLoaded', () => {

    let cart = []; // Le panier
    const CART_KEY = 'eshop_cart_v1';

    const cartCountEl = document.getElementById('cart-count');
    const checkoutForm = document.getElementById('checkout-form');
    const successMessage = document.getElementById('payment-success-message');
    const formError = document.getElementById('form-error');
    const cardNumberInput = document.getElementById('card-number');
    const cardExpiryInput = document.getElementById('card-expiry');

    try {
        const saved = sessionStorage.getItem(CART_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                cart = parsed;
            }
        }
    } catch (_) {  }


    function addToCart(id, name, price, image) {
        const existingItem = cart.find(item => item.id === id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id, name, price: parseFloat(price), image, quantity: 1 });
        }

        console.log('Panier:', cart);
        updateCartUI();
    }

    function updateCartUI() {
        try { sessionStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (_) {}
        if (cartCountEl) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCountEl.textContent = totalItems;
        }

        renderCheckoutSummary();
    }

    function renderCheckoutSummary() {
        const summaryContainer = document.getElementById('cart-summary-items');
        const subtotalEl = document.getElementById('summary-subtotal');
        const shippingEl = document.getElementById('summary-shipping');
        const totalEl = document.getElementById('summary-total');

        if (!summaryContainer || !subtotalEl || !shippingEl || !totalEl) {
            return;
        }

        summaryContainer.innerHTML = '';

        if (cart.length === 0) {
            summaryContainer.innerHTML = '<p id="empty-cart-message" class="empty-cart-message">Votre panier est vide.</p>';
        } else {
            cart.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'summary-item';
                itemEl.innerHTML = `
                            <img src="${item.image}" alt="${item.name}" class="summary-item-image">
                            <div class="summary-item-details">
                                <p class="summary-item-name">${item.name}</p>
                                <p class="summary-item-quantity">${item.quantity} x ${item.price.toFixed(2)}MAD</p>
                            </div>
                            <p class="summary-item-price">${(item.quantity * item.price).toFixed(2)}MAD</p>
                        `;
                summaryContainer.appendChild(itemEl);
            });
        }

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = cart.length > 0 ? 50.00 : 0.00;
        const total = subtotal + shipping;

        subtotalEl.textContent = `${subtotal.toFixed(2)} MAD`;
        shippingEl.textContent = `${shipping.toFixed(2)} MAD`;
        totalEl.textContent = `${total.toFixed(2)} MAD`;
    }

    updateCartUI();

    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const { id, name, price, image } = e.target.dataset;
            addToCart(id, name, price, image);

            e.target.textContent = 'Ajouté !';
            e.target.classList.add('added');
            setTimeout(() => {
                e.target.textContent = 'Ajouter au panier';
                e.target.classList.remove('added');
            }, 1500);
        });
    });


    function luhnCheck(num) {
        const digits = num.replace(/\D/g, '');
        let sum = 0, shouldDouble = false;
        for (let i = digits.length - 1; i >= 0; i--) {
            let d = parseInt(digits.charAt(i), 10);
            if (shouldDouble) {
                d *= 2;
                if (d > 9) d -= 9;
            }
            sum += d;
            shouldDouble = !shouldDouble;
        }
        return digits.length >= 12 && sum % 10 === 0;
    }
    function validExpiry(value) {
        const m = /^([0-1]\d)\/(\d{2})$/.exec(value);
        if (!m) return false;
        let month = parseInt(m[1], 10); if (month < 1 || month > 12) return false;
        const now = new Date();
        const year = 2000 + parseInt(m[2], 10);
        const expDate = new Date(year, month, 0, 23, 59, 59);
        return expDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    function validCvc(value) {
        return /^\d{3,4}$/.test(value);
    }

    // Fonctions d'affichage d'erreurs
    function showFormError(msg) {
        if (!formError) return;
        formError.textContent = msg;
        formError.classList.add('visible');
    }
    function clearFormError() {
        if (!formError) return;
        formError.textContent = '';
        formError.classList.remove('visible');
    }

    if (cardNumberInput && cardExpiryInput) {
        cardNumberInput.addEventListener('input', () => {
            const digits = cardNumberInput.value.replace(/\D/g, '').slice(0, 16);
            cardNumberInput.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
        });
        cardExpiryInput.addEventListener('input', () => {
            const digits = cardExpiryInput.value.replace(/\D/g, '').slice(0, 4);
            if (digits.length <= 2) {
                cardExpiryInput.value = digits;
            } else {
                cardExpiryInput.value = digits.slice(0,2) + '/' + digits.slice(2);
            }
        });
    }

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            clearFormError();

            if (cart.length === 0) {
                showFormError('Votre panier est vide. Ajoutez des produits avant de payer.');
                return;
            }

            const number = cardNumberInput ? cardNumberInput.value : '';
            const expiry = cardExpiryInput ? cardExpiryInput.value : '';
            const cvc = document.getElementById('card-cvc') ? document.getElementById('card-cvc').value : '';

            if (!luhnCheck(number)) {
                showFormError('Le numéro de carte est invalide.');
                return;
            }
            if (!validExpiry(expiry)) {
                showFormError("La date d'expiration est invalide ou passée.");
                return;
            }
            if (!validCvc(cvc)) {
                showFormError('Le CVC doit contenir 3 ou 4 chiffres.');
                return;
            }

            // Paiement simulé OK
            if (successMessage) {
                successMessage.classList.add('visible');
            }

            cart = [];
            updateCartUI();
            try { sessionStorage.removeItem(CART_KEY); } catch (_) {}

            setTimeout(() => {
                if (successMessage) {
                    successMessage.classList.remove('visible');
                }
                window.location.href = 'e-shop.html';
                checkoutForm.reset();
            }, 3000);
        });
    }
});