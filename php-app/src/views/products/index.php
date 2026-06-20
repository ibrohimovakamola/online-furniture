<h1>Products</h1>
<ul>
<?php foreach ($products as $p): ?>
    <li><a href="/products/<?= (int) $p['id'] ?>"><?= htmlspecialchars($p['name'] ?? '', ENT_QUOTES, 'UTF-8') ?></a></li>
<?php endforeach; ?>
</ul>
