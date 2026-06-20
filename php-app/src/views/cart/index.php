<h1>Cart</h1>
<?php if (empty($items)): ?>
    <p>Your cart is empty.</p>
<?php else: ?>
    <pre><?= htmlspecialchars(json_encode($items, JSON_PRETTY_PRINT), ENT_QUOTES, 'UTF-8') ?></pre>
<?php endif; ?>
