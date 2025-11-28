let categories=[]
let products=[]

let currentUser={
    name:"",
    email:"",
     phone:"",
    address:""
  
}

let recentlyViewed=[]
let filteredProducts=[]
let cart =[]
let orders=[]   
let currentOrderSteps=1;

async function loadData(){
    try{
        const response=await fetch('data.json');
        if(!response.ok){
            throw new Error('Failed To Load Data');
        }
        const data=await response.json();
        categories=data.categories;
        products=data.products;

        initializeApp();

    }catch(error){
        console.error("Error loading data:", error);

        document.body.innerHTML='<div style="text-align:center; margin-top:50px;"><h2>Failed to load data. please refresh the page.</h2></div>';

    }
}

function initializeApp(){
    loadUserData();
    loadCartData();
    loadRecentlyViewed();
    renderCategories();
    showPage('home');
}

document.addEventListener("DOMContentLoaded",function(){
    loadData()
});


function showPage(pageId){
    const pages=document.querySelectorAll('.page');
    pages.forEach(page=>page.classList.add('hidden'));

    // normalize and map logical page IDs to actual element IDs in DOM
    const map = {
        'home': 'homepage',
        'category': 'categoryPage',
        'product': 'productPage',
        'cart': 'cartPage',
        'orders': 'ordersPage',
    'order': 'orderPage',
        'account': 'accountPage'
    };
    const targetId = map[pageId] || pageId;
        let targetPage = document.getElementById(targetId) || document.getElementById(pageId + "Page") || document.getElementById(pageId);
    
    // If user HTML doesn't include an orders page, create a minimal container at runtime
    if(!targetPage && pageId === 'orders'){
        const main = document.querySelector('.main-container') || document.body;
        const el = document.createElement('div');
        el.id = 'ordersPage';
        el.className = 'page hidden';
        el.innerHTML = `
            <div class="container">
                <h1>My Orders</h1>
                <div id="orderList"></div>
            </div>`;
        main.appendChild(el);
        targetPage = el;
    }
    if(targetPage){
        targetPage.classList.remove('hidden');
    }

switch(pageId){
        case 'home':
          renderCategories();
            break;
        case "cart":
            renderCart();
            break;
         case "orders":
                renderOrders();
                break;
    case "order":
        // when navigating to the place-order flow, render the order steps UI
        renderOrderSteps();
        break;
         case "account":
                loadUserAccountPage();
                break;
}
}
function toggleSidebar(){
    const sidebar = document.querySelector(".sidebar")
    const overlay = document.querySelector(".sidebar-overlay")

    sidebar.classList.toggle("active")
     overlay.classList.toggle("active")

}

function searchProducts(){
    // safe lookup for the search input (id added in HTML). fall back to first .search-bar input
    const inputEl = document.getElementById("searchInput") || document.querySelector('.search-bar input');
    if(!inputEl) return;

    const raw = (inputEl.value || "").trim();
    const searchTerm = raw.toLowerCase();
    if(searchTerm === "") return; // nothing to search

    // Filter products by name, brand or description (case-insensitive)
    filteredProducts = products.filter(product => {
        const name = String(product.name || "").toLowerCase();
        const brand = String(product.brand || "").toLowerCase();
        const desc = String(product.description || "").toLowerCase();
        return name.includes(searchTerm) || brand.includes(searchTerm) || desc.includes(searchTerm);
    });

    // Update heading and render results using existing flows
    const titleEl = document.getElementById("categoryTitle");
    if(titleEl) titleEl.textContent = `Search results for "${raw}"`;
    populateFilters();
    renderProducts();
    showPage("category");
}

function renderCategories(){
    // HTML uses id="categoryGrid" so select that
    const categoriesGrid=document.getElementById("categoryGrid");
    categoriesGrid.innerHTML='';

    categories.forEach(category=>{
        const categoryCard=document.createElement('div');
        categoryCard.className='category-card'; 
        categoryCard.onclick=()=>showCategory(category.id);

        let cardContent=`
        <img src="${category.image}" alt="${category.name}">
    <div class="category-card-content">
        <h3>${category.name}</h3>
        <p>${category.description}</p> `;

        if(category.isRecentlyViewed){
            if(recentlyViewed.length == 0){
                cardContent +=`<p><em>No recently viewed products</em></p>`;
            } else {
                cardContent +=`<p> You have ${recentlyViewed.length} recently viewed items </p>`;
            }
        }

        cardContent +=` <a href="#" class="category-btn">View Products</a>
        </div>`;

        categoryCard.innerHTML=cardContent;
        categoriesGrid.appendChild(categoryCard);
    });
}

function showCategory(categoryId){
  
    if(categoryId === "recently-viewed"){
        // show products that are in recentlyViewed (ids)
        filteredProducts = products.filter(product => recentlyViewed.includes(product.id));

       document.getElementById("categoryTitle").textContent = "Recently Viewed Products";
    } else {
        filteredProducts = products.filter(product => product.category === categoryId);
        const category = categories.find(cat=>cat.id===categoryId);
        document.getElementById("categoryTitle").textContent = category.name ;
    }
    populateFilters();
    renderProducts();
    showPage('category');
}

function populateFilters(){
    const brandFilter = document.getElementById("brandFilter");
   const brands = [...new Set(filteredProducts.map(product => product.brand))];

    brandFilter.innerHTML = '<option value="All Brands">All Brands</option>';
    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        brandFilter.appendChild(option);
    });

    // Attach event listeners to filters
    document.getElementById("sortBy").addEventListener("change", applyFilters);
    document.getElementById("priceRange").addEventListener("input", applyFilters);
    document.getElementById("brandFilter").addEventListener("change", applyFilters);
}
function applyFilters(){
    const sortBy = document.getElementById("sortBy").value;
    const maxPrice = parseInt(document.getElementById("priceRange").value);
    const selectedBrand = document.getElementById("brandFilter").value;

    document.getElementById("priceValue").textContent = "₹"+ maxPrice;

    let filtered =filteredProducts.filter(product =>{ 
        if(product.price > maxPrice) return false;
        if(selectedBrand !== "All Brands" && product.brand !== selectedBrand) return false;

        return true;
    });
    switch (sortBy){
        case "price-low":
            filtered.sort((a,b)=>a.price - b.price);
            break;
        case "price-high":
            filtered.sort((a,b)=>b.price - a.price);
            break;  
            case "rating":
                filtered.sort((a,b)=>b.rating - a.rating);
                break;
                default:
                    break;
    }
    renderProducts(filtered);
}
function renderProducts(products = filteredProducts){
    // HTML uses id="productGrid"
    const productsGrid = document.getElementById("productGrid");
    productsGrid.innerHTML='';
    if (products.length === 0){
        productsGrid.innerHTML='<p>No products found matching the selected filters.</p>';
        return;
    }
    products.forEach(product=>{
        const productCard = document.createElement('div');
        productCard.className='product-card';
        productCard.onclick=()=>showProduct(product.id);

        productCard.innerHTML=`
        <img src="${product.image}" alt="${product.name}">
        <div class="product-card-content">
        <div class="product-brand">${product.brand}</div>
        <h3>${product.name}</h3>
        <div class="product-rating">
         ${'⭐'.repeat(Math.floor(product.rating))}${'⭐'.repeat(5 - Math.floor(product.rating))}
         (${product.rating})
        </div>
        <div class="product-price">
        <span class="current-price">₹${product.price}</span>
        <span class="original-price">₹${product.originalPrice}</span>
        <span class="discount">₹${product.discount}% OFF</span>
        </div>
        </div>
       
        `;
        productsGrid.appendChild(productCard);
    });
}

function showProduct(productId){
    const product = products.find(p=>p.id === productId);
    if(!product) return;    

    if(!recentlyViewed.includes(productId)){
        recentlyViewed.unshift(productId);
        if(recentlyViewed.length > 10){
            recentlyViewed.pop();
        }
        saveRecentlyViewed();
    }
    const productDetail = document.getElementById("productDetail");
    const delivertyDate = new Date();
    delivertyDate.setDate(delivertyDate.getDate() + 7);

    productDetail.innerHTML=`
    <div>
        <div>
            <img src="${product.image}" alt="${product.name}" class="product-image">
        </div>
    <div class="product-info">
    <h2>${product.name}</h2>
    <div class="brand">${product.brand}</div>
    <div class="product-rating">
     ${'⭐'.repeat(Math.floor(product.rating))}${'⭐'.repeat(5 - Math.floor(product.rating))}
         (${product.rating})/5
    </div>
    <div class="product-price">
    <span class="current-price">₹${product.price}</span>
    <span class="original-price">₹${product.originalPrice}</span>
    <span class="discount">₹${product.discount}% OFF</span>
    </div>
    <div class="description">${product.description}</div>

    <div class="product-option">
    ${product.colors.length >0 ? `
        <div class="option-group">
        <label> Color:</label>
        <select id="selectedColor">
        ${product.colors.map(color=>`<option value="${color}">${color}</option>`).join('')}
        </select>
        </div>
    `: ''}

    ${product.sizes.length >0 ? `
        <div class="option-group">
        <label> Size:</label>
        <select id="selectedSize">
        ${product.sizes.map(size=>`<option value="${size}">${size}</option>`).join('')}
        </select>
        </div>
    `: ''}
    </div>

    <div class="address-section">
    <h3>Delivery Address</h3>
    ${currentUser.address ? `
        <p>${currentUser.address}</p>
        <button class="btn-secondary" onclick="showPage('account')">Change Address</button >
    `: `
    <p>No address added.</p>
    <button class="btn-secondary" onclick="showPage('account')">Add Address</button>
    `}
    </div>

    <div class="delivery-info">
    <h4>Delivery Information </h4>
    <p> Delivery by ${delivertyDate.toLocaleDateString()}</p>
    <p>10 days easy returns available</p>
    <p>💰Cash on Delivery available</p>
    </div>


    <div class="product-actions">
    <button class="btn-primary" onclick="addToCart('${product.id}')">Add to Cart</button>
    <button class="btn-secondary" onclick="buyNow('${product.id}')">Buy Now</button>
    </div>
    </div>
    `;
    showPage('product');
}

function buyNow(productId){
    addToCart(productId);
    showPage("cart");
}   


function addToCart(productId){
    // coerce id because onclick templates pass strings
    const id = Number(productId);
    const product = products.find(p => p.id === id);
    if(!product) return;

    const selectedColor = document.getElementById("selectedColor")?.value || "";
    const selectedSize = document.getElementById("selectedSize")?.value || "";

    const existingItem = cart.find(item => item.id === id && item.color === selectedColor && item.size === selectedSize);

    if(existingItem){
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: id,
            name: product.name,
            brand: product.brand,
            price: product.price,
            originalPrice: product.originalPrice,
            discount: product.discount,
            image: product.image,
            color: selectedColor,
            size: selectedSize,
            quantity: 1
        });
    }

    updateCartCount();
    saveCartData();
    alert("Product added to cart");
}

function renderCart(){
    // HTML uses id="cart-items" in index.html
    const cartItems = document.getElementById("cartItems") || document.getElementById('cart-items');
    const cartSummary = document.getElementById("cartSummary");

    if(cart.length === 0){
        cartItems.innerHTML = '<p>Your cart is empty. <a href="#" onclick="showPage(\'home\')">Continue Shopping</a></p>';
        cartSummary.innerHTML = '';
        return;
    }
  cartItems.innerHTML = '';
  let totalOriginal = 0;
  let totalDiscounted = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        const itemOriginalTotal = item.originalPrice * item.quantity;
        totalOriginal += itemOriginalTotal;
        totalDiscounted += itemTotal;

    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
        cartItem.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-details">
        <h3>${item.name}</h3>
         <div class="product-brand">${item.brand}</div>
        ${item.color ? `<p>Color: ${item.color}</p>` : ''}
       ${item.size ? `<p>Size: ${item.size}</p>` : ''}
       <div class="product-price">
       <span class="current-price">₹${item.price}</span>
       <span class="original-price">₹${item.originalPrice}</span>
       <span class="discount">${item.discount}% OFF</span>
       </div>

        <div class="quantity-control">  
        <button  class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
        <input type="number" class="quantity-input" value="${item.quantity}" min="1" onchange="setQuantity(${index}, this.value)">
        <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
        </div>

        <p>Total: ₹${itemTotal}</p>
        </div>
        <button class= "btn-secondary" onclick="removeFromCart(${index})">Remove</button>
        `;
        cartItems.appendChild(cartItem);
    });

    const deliveryCharges = totalDiscounted > 500 ? 0 : 50;
    const finalTotal = totalDiscounted + deliveryCharges;   

    cartSummary.innerHTML = `
    <h3>Price Details</h3>
   <div class="summary-row">
   <span> Total MRP</span>
   <span>₹${totalOriginal}</span>
   </div>

    <div class="summary-row">   
    <span>Discount:</span>
    <span>-₹${totalOriginal - totalDiscounted}</span>
    </div>
    <div class="summary-row">
    <span>Delivery Charges</span>
    <span>${deliveryCharges === 0 ? 'FREE' : '₹' + deliveryCharges}</span>
    </div>
    <div class="summary-divider"></div>
    <div class="summary-row summary-total">
    <span>Total Amount</span>
    <span>₹${finalTotal}</span>
    </div>

    <button class="btn-primary" onclick="proceedToCheckout()" style="width:100%; margin-top:20px;">
    Place Order</button>
    `;
}

function updateQuantity(index, change,newValue = null){
    if(newValue !== null){
        cart[index].quantity = Math.max(1, parseInt(newValue) || 1);
    } else {
        cart[index].quantity = Math.max(1, cart[index].quantity + change);
    }   

    updateCartCount();
    saveCartData();
    renderCart();
}   

function renderOrderSteps(){
    const orderSteps = document.getElementById("orderSteps");
   
    if(currentOrderSteps === 1){
        if(!currentUser.name || !currentUser.address || !currentUser.phone){
            orderSteps.innerHTML=`
            <div class="order-form">
            <h2>Step 1: Enter Your Details</h2>
            <div class="form-group">
            <label for="orderName">Name:</label>
            <input type="text" id="orderName" value="${currentUser.name}" placeholder="Enter your name">
            </div>
            <div class="form-group">
            <label for="orderPhone">Phone Number:</label>
            <input type="tel" id="orderPhone" value="${currentUser.phone}" placeholder="Enter your phone number">
            </div>
            <div class="form-group">
            <label for="orderAddress">Address:</label>
            <textarea id="orderAddress" placeholder="Enter your address">${currentUser.address}</textarea>
            </div>
            <button class="btn-primary" onclick="saveOrderDetails()">Save and Continue</button>
            </div>
            `;
        }else{
            currentOrderSteps = 2;
            renderOrderSteps();
        }
    } else if (currentOrderSteps === 2){
        const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryCharges = cartTotal > 500 ? 0 : 50;
        const finalTotal = cartTotal + deliveryCharges;

        let cartItemsHtml = '';
        cart.forEach(item => {
            cartItemsHtml += `
            <div class="cart-item">
            <img src="${item.image}" alt="${item.name}"
            <div class="cart-item-details">
            <h3>${item.name}</h3>
            <div class="product-brand">${item.brand}</div>
            ${item.color ? `<p>Color: ${item.color}</p>` : ' '}
            ${item.size ? `<p>Size: ${item.size}</p>` : ' '}    
            <p>Quantity: ${item.quantity}</p>
            <p>Price: ₹${item.price * item.quantity}</p>
            </div>
            </div>
            `;
        })

        orderSteps.innerHTML=`
        <div class="order-form">
        <h2>Step 2: Order Summary</h2>
        <div class="address-section">
        <h3>Delivery Address</h3>
        <p><strong>${currentUser.name}</strong></p>
        <p>${currentUser.phone}</p>
        <p>${currentUser.address}</p>
       
        </div>

        <h3>Order Items</h3>
        ${cartItemsHtml}

        <div-class="cart-summary">
        <div class="summary-row">
        <span>Items Total:</span>
        <span>₹${cartTotal}</span>
        </div>
        <div class="summary-row">   
        <span>Delivery Charges:</span>
        <span>${deliveryCharges === 0 ? 'FREE' : '₹' + deliveryCharges}</span>
         </div>
            <div class="summary-divider"></div>
            <div class="summary-row summary-total">
            <span>Total Amount:</span>
            <span>₹${finalTotal}</span>
            </div>
            </div>

            <button class="btn-primary" onclick="proceedToPayment()">Proceed to Payment</button>
            </div>
        `;
    } else if (currentOrderSteps === 3){
        orderSteps.innerHTML=`
        <div class="order-form">
        <h2>Step 3: Payment</h2>
        <div class="payment-options">
        <input type="radio" id="upi" name="payment" value="UPI" onchange="toggleUpiField(true)">
        <label for="upi">UPI</label>
        <div class="form-group" id="upiField" style="display:none; margin-top:12px;">
            <label for="upiId">Enter UPI ID:</label>
            <input type="text" id="upiId" placeholder="username@bank">
        </div>
        </div>
        <div class="payment-options">
        <input type="radio" id="cod" name="payment" value="COD" checked onchange="toggleUpiField(false)">
        <label for="cod">Cash on Delivery</label>
        </div>
    </div>
    <button class="btn-primary" onclick="placeOrder()">PlaceOrder</button>
        </div>
        `;
    }

}

function saveOrderDetails(){
    const name = document.getElementById("orderName").value.trim();
    const phone = document.getElementById("orderPhone").value.trim();
    const address = document.getElementById("orderAddress").value.trim();

    if(!name || !phone || !address){    
        alert("Please fill all required fields");
        return;
    }

    currentUser.name = name;
    currentUser.phone = phone;
    currentUser.address = address;
    saveUserData();

    currentOrderSteps = 2;
    renderOrderSteps();
}

function proceedToPayment(){
    currentOrderSteps = 3;
    renderOrderSteps();
}

function toggleUpiField(show){
    const field = document.getElementById("upiField");
    if(field) field.style.display = show ? "block" : "none";
}

function placeOrder(){
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;

    if(!paymentMethod){
        alert("Please select a payment method");
        return;
    }
    if(paymentMethod === "UPI"){
        const upiId = document.getElementById("upiId")?.value.trim();
        const upiPattern = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/;
        if(!upiId){
            alert("Please enter your UPI ID");
            return;
        }
        if(!upiPattern.test(upiId)){
            alert("Please enter a valid UPI ID (e.g., username@bank)");
            return;
        }
    }
    // generate an order id using timestamp
    const orderId = "ORD" + Date.now();
    const orderDate = new Date();
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);

    // compute totals once to avoid duplicate reduces and variable mistakes
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const deliveryCharges = cartTotal > 500 ? 0 : 50;

    const order = {
        id: orderId,
        items: [...cart],
        total: cartTotal,
        deliveryCharges: deliveryCharges,
        paymentMethod: paymentMethod,
        orderDate: orderDate,
        deliveryDate: deliveryDate,
        status: "confirmed",
        address: currentUser.address,
        phone: currentUser.phone,
        name: currentUser.name
    };

    orders.push(order);
    saveOrdersData();

    // clear cart and persist
    cart = [];
    saveCartData();
    updateCartCount();

    const orderStepsEl = document.getElementById("orderSteps");
    if(orderStepsEl){
        orderStepsEl.innerHTML = `
        <div class="order-success">
            <h1>Order Placed Successfully!</h1>
            <p>Your order ID is <strong>${orderId}</strong></p>
            <p>Estimated Delivery Date: ${deliveryDate.toLocaleDateString()}</p>
            <button class="btn-primary" onclick="showPage('orders')">View My Orders</button>
            <button class="btn-secondary" onclick="showPage('home')">Continue Shopping</button>
        </div>
        `;
    }
}

// small wrapper: some UI code calls cplaceOrder(), keep it working by delegating to placeOrder
function cplaceOrder(){
    placeOrder();
}

function renderOrders(){
    const orderList = document.getElementById("orderList");
    if(!orderList) return; // nothing to render

    if(!orders || orders.length === 0){
        orderList.innerHTML = '<p>No orders found. <a href="#" onclick="showPage(\'home\')">Start Shopping</a></p>';
        return;
    }

    orderList.innerHTML = '';
    const sortedOrders = [...orders].sort((a,b) => new Date(b.orderDate) - new Date(a.orderDate));

    sortedOrders.forEach(order => {
       // defensive defaults
       const orderDate = order.orderDate ? new Date(order.orderDate) : new Date();
       const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate) : new Date(orderDate.getTime() + 7*24*60*60*1000);
       const isDelivered = new Date() > deliveryDate;

       const orderDiv = document.createElement('div');
       orderDiv.className = 'order-card';

       // items HTML
       let orderItemsHtml = '';
       (order.items || []).forEach(item => {
            orderItemsHtml += `
            <div class="cart-item">
                <img src="${item.image || ''}" alt="${item.name || ''}">
                <div class="cart-item-details">
                    <h3>${item.name || ''}</h3>
                    <div class="product-brand">${item.brand || ''}</div>
                    ${item.color ? `<p>Color: ${item.color}</p>` : ''}
                    ${item.size ? `<p>Size: ${item.size}</p>` : ''}
                    <p>Quantity: ${item.quantity || 1}</p>
                    <p>Price: ₹${(item.price || 0) * (item.quantity || 1)}</p>
                </div>
            </div>
            `;
       });

       const totalPaid = (order.total || 0) + (order.deliveryCharges || 0);

       orderDiv.innerHTML = `
        <div class="order-header" onclick="toggleOrderDetails('${order.id}')">
            <div class="order-summary">
                <h3>Order ID: ${order.id}</h3>
                <span class="status-badge ${isDelivered ? 'delivered' : 'on-way'}">${isDelivered ? 'Delivered' : 'On the Way'}</span>
            </div>
            <div class="order-meta">
                <p><strong>Order date:</strong> ${orderDate.toLocaleDateString()}</p>
                <p><strong>Items:</strong> ${ (order.items || []).length } item${ (order.items || []).length > 1 ? 's' : '' }</p>
                <p><strong>Amount:</strong> ₹${ totalPaid }</p>
            </div>
            <div class="dropdown-arrow"><span class="arrow-icon">❤️</span></div>
        </div>

        <div class="order-details" id="details-${order.id}" style="display:none;">
            <div class="order-info">
                <p><strong>Delivery Date:</strong> ${deliveryDate.toLocaleDateString()}</p>
                <p><strong>Payment Method:</strong> ${String(order.paymentMethod || '').toUpperCase()}</p>
                <div class="address-section">
                    <h4>Delivery Address:</h4>
                    <p>${order.name || ''}</p>
                    <p>${order.phone || ''}</p>
                    <p>${order.address || ''}</p>
                </div>
                <h4>Order Items:</h4>
                ${orderItemsHtml}
                <div class="cart-summary">
                    <div class="summary-row"><span>Items Total:</span><span>₹${order.total || 0}</span></div>
                    <div class="summary-row"><span>Delivery Charges:</span><span>${order.deliveryCharges === 0 ? 'FREE' : '₹' + (order.deliveryCharges || 0)}</span></div>
                    <div class="summary-divider"></div>
                    <div class="summary-row summary-total"><span>Total Paid:</span><span>₹${ totalPaid }</span></div>
                </div>
            </div>
        </div>
       `;

       orderList.appendChild(orderDiv);
    });
}


    function toggleOrderDetails(orderId){
        const detailsDiv= document.getElementById(`details-${orderId}`)
        const arrowIcon = detailsDiv.previousElementSibling.querySelector(".arrow-icon")

        if(detailsDiv.style.display ==="none"){
            detailsDiv.style.display ="block";
            arrowIcon.style.transform = "rotate(180deg)"
        } else {
            detailsDiv.style.display = "none";
            arrowIcon.style.transform = "rotate(0deg)"

        }
        }
function saveOrdersData(){
   localStorage.setItem("ordersData",JSON.stringify(orders))
}

function loadUserAccountPage(){
    document.getElementById("userName").value = currentUser.name || "";
    document.getElementById("userEmail").value = currentUser.email || "";
    document.getElementById("userPhone").value = currentUser.phone || "";
    document.getElementById("userAddress").value = currentUser.address || "";
}

function saveUserInfo(){
    currentUser.name = document.getElementById("userName").value.trim()
    currentUser.email= document.getElementById("userEmail").value.trim()
    currentUser.phone = document.getElementById("userPhone").value.trim()
    currentUser.address= document.getElementById("userAddress").value.trim()

    saveUserData()
    alert("Information saved successfully!")

}


function removeFromCart(index){
    cart.splice(index, 1);
    updateCartCount();
    saveCartData();
    renderCart();
}

function proceedToCheckout(){
    currentOrderSteps = 1;
    showPage("order");
}


function updateCartCount(){
    const total = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const el = document.getElementById('cartcount') || document.getElementById('cartCount');
    if(el) el.textContent = total;
}

function saveCartData(){
   localStorage.setItem("cartData",JSON.stringify(cart))
}



function saveRecentlyViewed(){
   localStorage.setItem("recentlyViewedData",JSON.stringify(recentlyViewed))
}

function loadUserData(){
    const userData=localStorage.getItem("userData")
if(userData){
    currentUser = JSON.parse(userData)
}
}
function loadCartData(){
  const cartData=localStorage.getItem("cartData")
if(cartData){
    cart = JSON.parse(cartData)
    updateCartCount()
}
}


function loadOrdersData(){
    const ordersData=localStorage.getItem("ordersData")
if(ordersData){
    orders = JSON.parse(ordersData)
}
}

// Save user data to localStorage
function saveUserData(){
    try{
        localStorage.setItem("userData", JSON.stringify(currentUser));
    }catch(e){
        console.log('Storage not available');
    }
}

// Small wrapper used by quantity input onchange handlers
function setQuantity(index, value){
    updateQuantity(index, 0, value);
}

function loadRecentlyViewed(){
    
const recentlyViewedData=localStorage.getItem("recentlyViewedData")
if(recentlyViewedData){
    recentlyViewed = JSON.parse(recentlyViewedData)
}
}