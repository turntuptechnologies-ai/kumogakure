import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for a served database dump — `/database.sql`,
// `/backup/dump.sql`, `/wp-content/mysql.sql`, and the rest of the `*.sql`
// family scanners sweep for (CWE-200 / CWE-538). A retrievable dump is one
// of the highest-engagement disclosures there is: the scanner that grabs it
// goes on to use what is inside, which is the follow-up behaviour worth
// capturing.
//
// Shaped as real `mysqldump` output — the header comment block, the session
// variable save/restore preamble, `DROP TABLE IF EXISTS` / `CREATE TABLE` /
// `LOCK TABLES` / `INSERT` / `UNLOCK TABLES` per table, and the restore
// footer — because that structure is what a scanner's parser keys on.
//
// Every value is non-actionable per docs/RESPONSE_TEMPLATE_POLICY.md: the
// `user_pass` column carries the literal placeholder rather than a crackable
// hash, emails and site URLs are `.invalid`, and no real host, person, or
// organisation is named. Fully static; never reflects the request.

const body = `-- MySQL dump 10.13  Distrib 8.0.36, for Linux (x86_64)
--
-- Host: localhost    Database: example_db
-- ------------------------------------------------------
-- Server version	8.0.36-0ubuntu0.22.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table \`wp_options\`
--

DROP TABLE IF EXISTS \`wp_options\`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE \`wp_options\` (
  \`option_id\` bigint unsigned NOT NULL AUTO_INCREMENT,
  \`option_name\` varchar(191) NOT NULL DEFAULT '',
  \`option_value\` longtext NOT NULL,
  \`autoload\` varchar(20) NOT NULL DEFAULT 'yes',
  PRIMARY KEY (\`option_id\`),
  UNIQUE KEY \`option_name\` (\`option_name\`)
) ENGINE=InnoDB AUTO_INCREMENT=412 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table \`wp_options\`
--

LOCK TABLES \`wp_options\` WRITE;
/*!40000 ALTER TABLE \`wp_options\` DISABLE KEYS */;
INSERT INTO \`wp_options\` VALUES
(1,'siteurl','https://example.invalid','yes'),
(2,'home','https://example.invalid','yes'),
(3,'blogname','Example','yes'),
(4,'admin_email','admin@example.invalid','yes'),
(6,'blog_charset','UTF-8','yes'),
(33,'template','twentytwentyfour','yes'),
(34,'stylesheet','twentytwentyfour','yes'),
(88,'db_version','57155','yes'),
(211,'smtp_host','smtp.example.invalid','yes'),
(212,'smtp_user','mailer@example.invalid','yes'),
(213,'smtp_pass','REDACTED_FOR_HONEYPOT','yes');
/*!40000 ALTER TABLE \`wp_options\` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table \`wp_users\`
--

DROP TABLE IF EXISTS \`wp_users\`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE \`wp_users\` (
  \`ID\` bigint unsigned NOT NULL AUTO_INCREMENT,
  \`user_login\` varchar(60) NOT NULL DEFAULT '',
  \`user_pass\` varchar(255) NOT NULL DEFAULT '',
  \`user_nicename\` varchar(50) NOT NULL DEFAULT '',
  \`user_email\` varchar(100) NOT NULL DEFAULT '',
  \`user_registered\` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  \`display_name\` varchar(250) NOT NULL DEFAULT '',
  PRIMARY KEY (\`ID\`),
  KEY \`user_login_key\` (\`user_login\`),
  KEY \`user_nicename\` (\`user_nicename\`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table \`wp_users\`
--

LOCK TABLES \`wp_users\` WRITE;
/*!40000 ALTER TABLE \`wp_users\` DISABLE KEYS */;
INSERT INTO \`wp_users\` VALUES
(1,'admin','REDACTED_FOR_HONEYPOT','admin','admin@example.invalid','2023-03-14 09:41:02','Site Admin'),
(2,'editor','REDACTED_FOR_HONEYPOT','editor','editor@example.invalid','2023-05-02 14:07:55','Content Editor'),
(3,'svc_backup','REDACTED_FOR_HONEYPOT','svc-backup','ops@example.invalid','2023-05-02 14:09:31','Backup Service'),
(4,'demo','REDACTED_FOR_HONEYPOT','demo','demo@example.invalid','2024-01-19 11:22:40','Demo User');
/*!40000 ALTER TABLE \`wp_users\` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table \`wp_usermeta\`
--

DROP TABLE IF EXISTS \`wp_usermeta\`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE \`wp_usermeta\` (
  \`umeta_id\` bigint unsigned NOT NULL AUTO_INCREMENT,
  \`user_id\` bigint unsigned NOT NULL DEFAULT '0',
  \`meta_key\` varchar(255) DEFAULT NULL,
  \`meta_value\` longtext,
  PRIMARY KEY (\`umeta_id\`),
  KEY \`user_id\` (\`user_id\`),
  KEY \`meta_key\` (\`meta_key\`(191))
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table \`wp_usermeta\`
--

LOCK TABLES \`wp_usermeta\` WRITE;
/*!40000 ALTER TABLE \`wp_usermeta\` DISABLE KEYS */;
INSERT INTO \`wp_usermeta\` VALUES
(1,1,'nickname','admin'),
(13,1,'wp_capabilities','a:1:{s:13:"administrator";b:1;}'),
(14,1,'wp_user_level','10'),
(27,2,'wp_capabilities','a:1:{s:6:"editor";b:1;}'),
(41,3,'wp_capabilities','a:1:{s:13:"administrator";b:1;}'),
(55,4,'wp_capabilities','a:1:{s:10:"subscriber";b:1;}');
/*!40000 ALTER TABLE \`wp_usermeta\` ENABLE KEYS */;
UNLOCK TABLES;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-11-08 03:14:07
`;

export const fakeSqlDump: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
