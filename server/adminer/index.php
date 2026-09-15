<?php
// Suppress PHP 8.x notices/warnings from corrupting Adminer HTML output
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_WARNING & ~E_NOTICE & ~E_DEPRECATED);

// Auto-login to MySQL 127.0.0.1:3307 for Adminer
session_name('adminer_sid');
session_start();
if (empty($_SESSION['pwds']['server']['127.0.0.1:3307']['root'])) {
    $_SESSION['pwds']['server']['127.0.0.1:3307']['root'] = '87A8Rqp1npAuTZk0UfIoaGDJriTtIEuvtqcazPCB4rg';
}

if (empty($_GET['server']) && empty($_POST)) {
    header('Location: ?server=127.0.0.1%3A3307&username=root&db=training_management');
    exit;
}

function adminer_object() {
    class AdminerAutologin extends Adminer {
        function name() {
            return 'Cổng Quản Trị CSDL MySQL (T04 - 127.0.0.1:3307)';
        }
        function credentials() {
            return array('127.0.0.1:3307', 'root', '87A8Rqp1npAuTZk0UfIoaGDJriTtIEuvtqcazPCB4rg');
        }
        function database() {
            return 'training_management';
        }
        function login($login, $password) {
            return true;
        }
    }
    return new AdminerAutologin;
}

include __DIR__ . '/adminer_base.php';
