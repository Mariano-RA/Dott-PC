ALTER USER 'do0tt'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'Depor420';
ALTER USER 'do0tt'@'%' IDENTIFIED WITH caching_sha2_password BY 'Depor420';
ALTER USER 'do0tt'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Depor420';
ALTER USER 'do0tt'@'%' IDENTIFIED WITH mysql_native_password BY 'Depor420';
ALTER USER 'root'@'localhost' IDENTIFIED BY 'marianonano12';

GRANT ALL PRIVILEGES ON database_name.* TO 'do0tt'@'localhost';
GRANT ALL PRIVILEGES ON database_name.* TO 'do0tt'@'%';

FLUSH PRIVILEGES;