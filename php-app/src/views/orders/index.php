<h1>My orders</h1>
<ul>
<?php foreach ($orders as $o): ?>
    <li>#<?= (int) $o['id'] ?> — <?= htmlspecialchars($o['status'] ?? '', ENT_QUOTES, 'UTF-8') ?></li>
<?php endforeach; ?>
</ul>
