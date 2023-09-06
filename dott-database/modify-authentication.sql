ALTER USER 'dott'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'Depor420';
ALTER USER 'dott'@'%' IDENTIFIED WITH caching_sha2_password BY 'Depor420';
ALTER USER 'dott'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Depor420';
ALTER USER 'dott'@'%' IDENTIFIED WITH mysql_native_password BY 'Depor420';
ALTER USER 'root'@'localhost' IDENTIFIED BY 'marianonano12';

GRANT ALL PRIVILEGES ON database_name.* TO 'dott'@'localhost';
GRANT ALL PRIVILEGES ON *.* TO 'dott_dottdb'@'186.12.184.161';

FLUSH PRIVILEGES;