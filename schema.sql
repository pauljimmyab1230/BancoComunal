-- ============================================================
--  Banquito Solidario - Esquema de base de datos
--  GENERADO AUTOMATICAMENTE desde backend/prisma/schema.prisma
--
--  No editar a mano. Para cambiar el esquema:
--    1. Editar backend/prisma/schema.prisma
--    2. Ejecutar: npm run db:schema  (desde backend/)
-- ============================================================

SET NAMES utf8mb3;

-- CreateTable
CREATE TABLE `socio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(20) NOT NULL,
    `dni` CHAR(8) NOT NULL,
    `nombres` VARCHAR(100) NOT NULL,
    `apellidoPaterno` VARCHAR(50) NOT NULL,
    `apellidoMaterno` VARCHAR(50) NOT NULL,
    `genero` CHAR(1) NOT NULL,
    `fechaNacimiento` DATETIME(3) NULL,
    `estadoCivil` CHAR(1) NULL,
    `telefono` VARCHAR(9) NULL,
    `direccion` VARCHAR(200) NULL,
    `email` VARCHAR(150) NULL,
    `fechaIngreso` DATETIME(3) NOT NULL,
    `estado` CHAR(1) NOT NULL DEFAULT 'A',
    `fotoUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `socio_codigo_key`(`codigo`),
    UNIQUE INDEX `socio_dni_key`(`dni`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `beneficiario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dni` CHAR(8) NOT NULL,
    `nombres` VARCHAR(100) NOT NULL,
    `apellidoPaterno` VARCHAR(50) NOT NULL,
    `apellidoMaterno` VARCHAR(50) NOT NULL,
    `fechaNacimiento` DATETIME(3) NULL,
    `parentesco` VARCHAR(50) NOT NULL,
    `telefono` VARCHAR(9) NULL,
    `socio_id` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `beneficiario_socio_id_idx`(`socio_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documentosocio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipoDocumento` VARCHAR(50) NOT NULL,
    `nombreArchivo` VARCHAR(255) NOT NULL,
    `rutaArchivo` VARCHAR(500) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `tamano` INTEGER NOT NULL,
    `socio_id` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `documentosocio_socio_id_idx`(`socio_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombres` VARCHAR(100) NOT NULL,
    `apellidoPaterno` VARCHAR(50) NOT NULL,
    `apellidoMaterno` VARCHAR(50) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `correo` VARCHAR(150) NULL,
    `telefono` VARCHAR(20) NULL,
    `rol` VARCHAR(45) NOT NULL,
    `estado` VARCHAR(45) NOT NULL DEFAULT 'ACTIVO',
    `cambiarPassword` BOOLEAN NOT NULL DEFAULT false,
    `ultimoAcceso` DATETIME(3) NULL,
    `intentosFallidos` INTEGER NOT NULL DEFAULT 0,
    `bloqueadoHasta` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuario_username_key`(`username`),
    UNIQUE INDEX `usuario_correo_key`(`correo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fondorotatorio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(200) NOT NULL,
    `organizacion` VARCHAR(200) NOT NULL DEFAULT '',
    `capitalInicial` DECIMAL(12, 2) NOT NULL,
    `capitalDisponible` DECIMAL(12, 2) NOT NULL,
    `moneda` CHAR(3) NOT NULL DEFAULT 'PEN',
    `estado` VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    `descripcion` TEXT NULL,
    `reglamento` TEXT NULL,
    `condiciones` TEXT NULL,
    `fechaCierre` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FondoSocio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fechaIngreso` DATETIME(3) NULL,
    `fechaSalida` DATETIME(3) NULL,
    `numeroSocio` INTEGER NULL,
    `cargo` VARCHAR(45) NULL,
    `nivel` VARCHAR(45) NULL,
    `observacion` VARCHAR(45) NULL,
    `fechaAprobacion` DATETIME(3) NULL,
    `usuario_id` INTEGER NULL,
    `fondorotatorio_id` INTEGER NOT NULL,
    `socio_id` INTEGER NOT NULL,

    INDEX `FondoSocio_socio_id_idx`(`socio_id`),
    INDEX `FondoSocio_fondorotatorio_id_idx`(`fondorotatorio_id`),
    UNIQUE INDEX `FondoSocio_fondorotatorio_id_socio_id_key`(`fondorotatorio_id`, `socio_id`),
    UNIQUE INDEX `FondoSocio_fondorotatorio_id_numeroSocio_key`(`fondorotatorio_id`, `numeroSocio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aporte` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` VARCHAR(20) NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `periodo` CHAR(7) NOT NULL,
    `fechaAporte` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `metodoPago` VARCHAR(20) NOT NULL DEFAULT 'EFECTIVO',
    `comprobante` VARCHAR(100) NULL,
    `observacion` TEXT NULL,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    `claveUnica` VARCHAR(50) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `FondoSocio_Id` INTEGER NOT NULL,

    UNIQUE INDEX `aporte_claveUnica_key`(`claveUnica`),
    INDEX `aporte_FondoSocio_Id_idx`(`FondoSocio_Id`),
    INDEX `aporte_periodo_idx`(`periodo`),
    INDEX `aporte_estado_idx`(`estado`),
    INDEX `aporte_fechaAporte_idx`(`fechaAporte`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prestamo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `monto` DECIMAL(12, 2) NOT NULL,
    `tasaInteres` DECIMAL(5, 2) NOT NULL,
    `numeroCuotas` INTEGER NOT NULL,
    `montoCuota` DECIMAL(12, 2) NOT NULL,
    `totalInteres` DECIMAL(12, 2) NOT NULL,
    `fechaDesembolso` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaPrimerVencimiento` DATETIME(3) NOT NULL,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `FondoSocio_Id` INTEGER NOT NULL,

    INDEX `prestamo_FondoSocio_Id_idx`(`FondoSocio_Id`),
    INDEX `prestamo_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cuotaprestamo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero` INTEGER NOT NULL,
    `fechaVencimiento` DATETIME(3) NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `interes` DECIMAL(12, 2) NOT NULL,
    `amortizacion` DECIMAL(12, 2) NOT NULL,
    `saldo` DECIMAL(12, 2) NOT NULL,
    `montoPagado` DECIMAL(12, 2) NOT NULL,
    `saldoPendiente` DECIMAL(12, 2) NOT NULL,
    `fechaPago` DATETIME(3) NULL,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    `metodoPago` VARCHAR(20) NULL,
    `comprobante` VARCHAR(100) NULL,
    `prestamo_id` INTEGER NOT NULL,

    INDEX `cuotaprestamo_fechaVencimiento_idx`(`fechaVencimiento`),
    INDEX `cuotaprestamo_estado_idx`(`estado`),
    UNIQUE INDEX `cuotaprestamo_prestamo_id_numero_key`(`prestamo_id`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `caja` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(20) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` TEXT NULL,
    `tipo` VARCHAR(20) NOT NULL DEFAULT 'PRINCIPAL',
    `moneda` CHAR(3) NOT NULL DEFAULT 'PEN',
    `saldoInicial` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `saldoActual` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `fondorotatorio_id` INTEGER NOT NULL,

    UNIQUE INDEX `caja_codigo_key`(`codigo`),
    INDEX `caja_fondorotatorio_id_idx`(`fondorotatorio_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conceptocaja` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(20) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `tipo` VARCHAR(20) NOT NULL,
    `afectaSaldo` VARCHAR(10) NOT NULL,
    `descripcion` TEXT NULL,
    `requiereComprobante` BOOLEAN NOT NULL DEFAULT true,
    `orden` INTEGER NOT NULL DEFAULT 0,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `conceptocaja_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimientocaja` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(30) NOT NULL,
    `tipo` VARCHAR(20) NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `descripcion` TEXT NULL,
    `comprobante` VARCHAR(100) NULL,
    `metodoPago` VARCHAR(20) NOT NULL DEFAULT 'EFECTIVO',
    `referencia` VARCHAR(100) NULL,
    `fechaMovimiento` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` VARCHAR(20) NOT NULL DEFAULT 'REGISTRADO',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `caja_id` INTEGER NOT NULL,
    `conceptocaja_id` INTEGER NOT NULL,

    UNIQUE INDEX `movimientocaja_codigo_key`(`codigo`),
    INDEX `movimientocaja_caja_id_fechaMovimiento_idx`(`caja_id`, `fechaMovimiento`),
    INDEX `movimientocaja_fechaMovimiento_idx`(`fechaMovimiento`),
    INDEX `movimientocaja_estado_idx`(`estado`),
    INDEX `movimientocaja_referencia_idx`(`referencia`),
    INDEX `movimientocaja_conceptocaja_id_idx`(`conceptocaja_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `arqueocaja` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(30) NOT NULL,
    `fechaArqueo` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `saldoSistema` DECIMAL(12, 2) NOT NULL,
    `saldoFisico` DECIMAL(12, 2) NOT NULL,
    `diferencia` DECIMAL(12, 2) NOT NULL,
    `observacion` TEXT NULL,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `fechaAprobacion` DATETIME(3) NULL,
    `aprobadoPor` VARCHAR(50) NULL,
    `caja_id` INTEGER NOT NULL,

    UNIQUE INDEX `arqueocaja_codigo_key`(`codigo`),
    INDEX `arqueocaja_caja_id_fechaArqueo_idx`(`caja_id`, `fechaArqueo`),
    INDEX `arqueocaja_caja_id_idx`(`caja_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `flujocajaproyectado` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATE NOT NULL,
    `tipo` VARCHAR(20) NOT NULL,
    `concepto` VARCHAR(100) NOT NULL,
    `montoProyectado` DECIMAL(12, 2) NOT NULL,
    `montoReal` DECIMAL(12, 2) NULL,
    `descripcion` TEXT NULL,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'PROYECTADO',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `caja_id` INTEGER NOT NULL,

    INDEX `flujocajaproyectado_caja_id_fecha_idx`(`caja_id`, `fecha`),
    INDEX `flujocajaproyectado_caja_id_idx`(`caja_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auditlog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tabla` VARCHAR(50) NOT NULL,
    `registroId` INTEGER NOT NULL,
    `operacion` VARCHAR(20) NOT NULL,
    `datosAnteriores` JSON NULL,
    `datosNuevos` JSON NULL,
    `ip` VARCHAR(45) NULL,
    `usuario_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `auditlog_tabla_registroId_idx`(`tabla`, `registroId`),
    INDEX `auditlog_createdAt_idx`(`createdAt`),
    INDEX `auditlog_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refreshtoken` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(500) NOT NULL,
    `usuario_id` INTEGER NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refreshtoken_token_key`(`token`),
    INDEX `refreshtoken_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `beneficiario` ADD CONSTRAINT `beneficiario_socio_id_fkey` FOREIGN KEY (`socio_id`) REFERENCES `socio`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documentosocio` ADD CONSTRAINT `documentosocio_socio_id_fkey` FOREIGN KEY (`socio_id`) REFERENCES `socio`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FondoSocio` ADD CONSTRAINT `FondoSocio_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FondoSocio` ADD CONSTRAINT `FondoSocio_fondorotatorio_id_fkey` FOREIGN KEY (`fondorotatorio_id`) REFERENCES `fondorotatorio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FondoSocio` ADD CONSTRAINT `FondoSocio_socio_id_fkey` FOREIGN KEY (`socio_id`) REFERENCES `socio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aporte` ADD CONSTRAINT `aporte_FondoSocio_Id_fkey` FOREIGN KEY (`FondoSocio_Id`) REFERENCES `FondoSocio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prestamo` ADD CONSTRAINT `prestamo_FondoSocio_Id_fkey` FOREIGN KEY (`FondoSocio_Id`) REFERENCES `FondoSocio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cuotaprestamo` ADD CONSTRAINT `cuotaprestamo_prestamo_id_fkey` FOREIGN KEY (`prestamo_id`) REFERENCES `prestamo`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `caja` ADD CONSTRAINT `caja_fondorotatorio_id_fkey` FOREIGN KEY (`fondorotatorio_id`) REFERENCES `fondorotatorio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientocaja` ADD CONSTRAINT `movimientocaja_caja_id_fkey` FOREIGN KEY (`caja_id`) REFERENCES `caja`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientocaja` ADD CONSTRAINT `movimientocaja_conceptocaja_id_fkey` FOREIGN KEY (`conceptocaja_id`) REFERENCES `conceptocaja`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `arqueocaja` ADD CONSTRAINT `arqueocaja_caja_id_fkey` FOREIGN KEY (`caja_id`) REFERENCES `caja`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `flujocajaproyectado` ADD CONSTRAINT `flujocajaproyectado_caja_id_fkey` FOREIGN KEY (`caja_id`) REFERENCES `caja`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refreshtoken` ADD CONSTRAINT `refreshtoken_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

