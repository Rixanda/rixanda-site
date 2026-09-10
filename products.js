// Rixanda — shared product loading/rendering logic
// Reads product data from /data/products.json (edited via the admin CMS)
// and renders it into the page. No build step needed — this runs in the
// browser every time a page loads.

const WISHLIST_KEY = 'rixanda-wishlist';

function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function toggleWishlist(id) {
  let list = getWishlist();
  if (list.includes(id)) {
    list = list.filter(x => x !== id);
  } else {
    list.push(id);
  }
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  return list;
}

function heartSvg() {
  return '<svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>';
}

function productCardHtml(p, wishlist) {
  const saved = wishlist.includes(p.id) ? ' saved' : '';
  const img = p.cover_image
    ? `<img src="${p.cover_image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;">`
    : `<div class="thumb-fill">product cover image</div>`;
  return `
    <div class="product" style="cursor:pointer;">
      <div class="product-thumb" onclick="window.location.href='product.html?id=${p.id}'">
        ${img}
        <button class="wish-btn${saved}" onclick="event.stopPropagation(); this.classList.toggle('saved'); toggleWishlist('${p.id}');">
          ${heartSvg()}
        </button>
      </div>
      <p class="product-name" onclick="window.location.href='product.html?id=${p.id}'">${p.name}</p>
      <p class="product-price">$${p.price}</p>
    </div>`;
}

// ---- Catalog page (index.html) ----
function renderCatalog() {
  const gridEl = document.getElementById('product-grid');
  const countEl = document.getElementById('product-count');
  const catBarEl = document.getElementById('cat-bar');
  if (!gridEl) return;

  fetch('data/products.json')
    .then(r => r.json())
    .then(data => {
      const products = data.products || [];
      const wishlist = getWishlist();
      const categories = ['All', ...new Set(products.map(p => p.category))];

      // category pills
      if (catBarEl) {
        const params = new URLSearchParams(window.location.search);
        const active = params.get('category') || 'All';
        catBarEl.innerHTML = categories.map(c =>
          `<a class="cat-pill${c === active ? ' active' : ''}" href="index.html${c === 'All' ? '' : '?category=' + encodeURIComponent(c)}">${c}</a>`
        ).join('');

        const shown = active === 'All' ? products : products.filter(p => p.category === active);
        gridEl.innerHTML = shown.map(p => productCardHtml(p, wishlist)).join('');
        if (countEl) countEl.textContent = shown.length + (shown.length === 1 ? ' product' : ' products');
      } else {
        gridEl.innerHTML = products.map(p => productCardHtml(p, wishlist)).join('');
        if (countEl) countEl.textContent = products.length + ' products';
      }
    });
}

// ---- Wishlist page (wishlist.html) ----
function renderWishlist() {
  const gridEl = document.getElementById('product-grid');
  const countEl = document.getElementById('product-count');
  const emptyEl = document.getElementById('wish-empty');
  if (!gridEl) return;

  fetch('data/products.json')
    .then(r => r.json())
    .then(data => {
      const wishlist = getWishlist();
      const products = (data.products || []).filter(p => wishlist.includes(p.id));
      gridEl.innerHTML = products.map(p => productCardHtml(p, wishlist)).join('');
      if (countEl) countEl.textContent = products.length + (products.length === 1 ? ' saved item' : ' saved items');
      if (emptyEl) emptyEl.style.display = products.length === 0 ? 'block' : 'none';
      if (gridEl) gridEl.style.display = products.length === 0 ? 'none' : 'grid';
    });
}

// ---- Single product page (product.html?id=...) ----
function renderProductPage() {
  const wrapEl = document.getElementById('pp-wrap');
  if (!wrapEl) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  fetch('data/products.json')
    .then(r => r.json())
    .then(data => {
      const products = data.products || [];
      const p = products.find(x => x.id === id) || products[0];
      if (!p) return;

      const wishlist = getWishlist();
      const saved = wishlist.includes(p.id) ? ' saved' : '';

      document.title = p.name + ' — Rixanda';
      document.getElementById('pp-crumb-name').textContent = p.name;
      document.getElementById('pp-category').textContent = p.category;
      document.getElementById('pp-title').textContent = p.name;
      document.getElementById('pp-price').textContent = '$' + p.price;
      document.getElementById('pp-desc').textContent = p.description;

      const imgWrap = document.getElementById('pp-image-wrap');
      if (p.cover_image) {
        imgWrap.innerHTML = `<img src="${p.cover_image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;">`;
      }

      const wishBtn = document.getElementById('pp-wish-btn');
      if (wishBtn) {
        wishBtn.classList.toggle('saved', wishlist.includes(p.id));
        wishBtn.onclick = () => {
          const list = toggleWishlist(p.id);
          wishBtn.classList.toggle('saved', list.includes(p.id));
        };
      }

      // Related products: everything except this one
      const relEl = document.getElementById('related-grid');
      if (relEl) {
        const rel = products.filter(x => x.id !== p.id);
        relEl.innerHTML = rel.map(rp => productCardHtml(rp, wishlist)).join('');
      }
    });
}

document.addEventListener('DOMContentLoaded', () => {
  renderCatalog();
  renderWishlist();
  renderProductPage();
});
