/* Detoxblanc — pages.js · tương tác cho PDP · Article · Checkout */

// PDP tabs
document.querySelectorAll('.pdp-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.panel;
    document.querySelectorAll('.pdp-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.pdp-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(target)?.classList.add('active');
    // smooth scroll to tabs
    document.querySelector('.pdp-tabs')?.scrollIntoView({ behavior:'smooth', block:'start' });
  });
});

// FAQ accordion
document.querySelectorAll('.faq-q').forEach(q => {
  q.addEventListener('click', () => {
    q.closest('.faq-item').classList.toggle('open');
  });
});

// PDP thumbnails
document.querySelectorAll('.pdp-thumb').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.pdp-thumb').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
  });
});

// Size option selector
document.querySelectorAll('.size-opt').forEach(opt => {
  opt.addEventListener('click', () => {
    const siblings = opt.parentElement.querySelectorAll('.size-opt');
    siblings.forEach(s => s.classList.remove('active'));
    opt.classList.add('active');
  });
});

// Qty controls
document.querySelectorAll('.qty-input').forEach(box => {
  const input = box.querySelector('input');
  box.querySelector('.q-dec')?.addEventListener('click', () => {
    const v = Math.max(1, parseInt(input.value || '1', 10) - 1);
    input.value = v;
  });
  box.querySelector('.q-inc')?.addEventListener('click', () => {
    const v = Math.min(10, parseInt(input.value || '1', 10) + 1);
    input.value = v;
  });
});

// Checkout — shipping/payment method selectors
document.querySelectorAll('.ship-methods .method, .pay-methods .method').forEach(m => {
  m.addEventListener('click', () => {
    const group = m.parentElement;
    group.querySelectorAll('.method').forEach(x => x.classList.remove('active'));
    m.classList.add('active');
    const input = m.querySelector('input');
    if (input) input.checked = true;
  });
});

// TOC scroll spy (article)
(function(){
  const tocLinks = document.querySelectorAll('.toc a');
  if (!tocLinks.length) return;
  const sections = Array.from(tocLinks).map(a => document.querySelector(a.getAttribute('href')));
  const onScroll = () => {
    const y = window.scrollY + 160;
    let idx = 0;
    sections.forEach((s, i) => { if (s && s.offsetTop <= y) idx = i; });
    document.querySelectorAll('.toc li').forEach((li, i) => li.classList.toggle('active', i === idx));
  };
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();
})();

// Wishlist heart toggle (PDP/cart)
document.querySelectorAll('.wish-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const i = btn.querySelector('i');
    const filled = i.classList.contains('fa-solid');
    i.classList.toggle('fa-regular', filled);
    i.classList.toggle('fa-solid', !filled);
    btn.style.color = filled ? '' : '#63C1BB';
    btn.style.borderColor = filled ? '' : '#63C1BB';
  });
});
