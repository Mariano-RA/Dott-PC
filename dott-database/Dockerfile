# Utiliza la imagen oficial de MySQL como punto de partida
FROM mysql/mysql-server:latest

# Variables de entorno para configurar la base de datos
ENV MYSQL_ROOT_PASSWORD=marianonano12
ENV MYSQL_DATABASE=dottpc
ENV MYSQL_USER=do0tt
ENV MYSQL_PASSWORD=Depor420

COPY modify-authentication.sql /docker-entrypoint-initdb.d/

# Puerto en el que MySQL estará escuchando
EXPOSE 3306
