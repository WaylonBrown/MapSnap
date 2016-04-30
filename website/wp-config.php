<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the
 * installation. You don't have to use the web site, you can
 * copy this file to "wp-config.php" and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * MySQL settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://codex.wordpress.org/Editing_wp-config.php
 *
 * @package WordPress
 */

// ** MySQL settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define('DB_NAME', 'mapsnapn_wordpress2de');

/** MySQL database username */
define('DB_USER', 'mapsnapn_word2de');

/** MySQL database password */
define('DB_PASSWORD', '2YdtuVKR1t2D');

/** MySQL hostname */
define('DB_HOST', 'localhost');

/** Database Charset to use in creating database tables. */
define('DB_CHARSET', 'utf8');

/** The Database Collate type. Don't change this if in doubt. */
define('DB_COLLATE', '');

/**#@+
 * Authentication Unique Keys and Salts.
 *
 * Change these to different unique phrases!
 * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}
 * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define('AUTH_KEY', '@+KvcErgK(EMqWbzZiNCyAfD-V;ru_%CNC=VKYZh)R;z!zEgQezA(XRHmXPL-!+gujA_[PZ>rb]frx+Ijvz_LSNH]-$fYsC=Lpul?wvudAs;CIf&*!!rXW!lfOs/_NwX');
define('SECURE_AUTH_KEY', 'UdyGVoU]pqz%IL>YAJ[ubM>)^)khJT[k%O>j*YC|tcg-CNxYc%@)e|kig!r}(yWwvqReBS}Y&@sh@_;+PZQA_QDsYbFH!iZFk?EUTdFF^l=sYl[IzdDc]<+Q%d;xtMTZ');
define('LOGGED_IN_KEY', 'Bf$w!ArlX!Y_%Ad<B>fsPragL%{D%Qb);G{i{GA=[_MA/AmYJSvUWVLL][i|b>t{<qJK-fo/R)oDGf]f<LMt&^nzPDg)Z-Ww(AGhi|?BQZ;s]R^VENvb$=altAPuVwkf');
define('NONCE_KEY', '^aRuSQJUOJ][bB=L;;[f[ku_&VJbSRJEBJQo!AHb)MpwDkXbr]]D@MzeZoLUT^daIWQQ-etQ<xY>]YxVlp@NfrtDs;anLvunNZ[X?r_wb?EaDsU@pSd=$s^Sr@Za{LL_');
define('AUTH_SALT', '{mbjO$v{YvM_[uzKt+Kla[{o%T+QD|pnhR+aL;kzHGvnM[GWQ)V!BED{%w*n_&$zPMyZy);%RmRy%I}/|iJY/xmQ@p$P]RWQam@l->;[d!{))!)cOlFhD@MpdEr?sC{E');
define('SECURE_AUTH_SALT', 'G!f{FS]uYD=f$DzOUs);WH;xp<LTQjtDPRm+nS-M;(V)+OfuH;wQj]yb!h+{Frt[/vQzB{ScLSx/%Oa%k&m|czb[{vrh!LEWzwXybVuqMjD@uOGPlpg^reWybUwA{rD>');
define('LOGGED_IN_SALT', 'SYtBzwJOSi)kAA/xrmMQSu<W{)ZS@d%m|P;)@RU=YvkihuyVI}S];|U!!jTc/t?&F_ETwn(yv_AeZZ=<m(ApIya>kl)V&)RB;bD{%>@SW?PMiqrA+u;]D^ddkOln]drB');
define('NONCE_SALT', 'u;{&@Tu-Ke_lEtnNp^=?/&Ux=CQJl>Ut*/ZNtY]g|PMlJGKgMyqybd&jFCYfN+-HjEin_[GBAjvvvSV?*Dt{XIgcA*{b<asX@wWW%K%O}_VQ+%(eVjwee;t!l}L}qj$E');

/**#@-*/

/**
 * WordPress Database Table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_xmqw_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the Codex.
 *
 * @link https://codex.wordpress.org/Debugging_in_WordPress
 */
define('WP_DEBUG', false);

/* That's all, stop editing! Happy blogging. */

/** Absolute path to the WordPress directory. */
if ( !defined('ABSPATH') )
	define('ABSPATH', dirname(__FILE__) . '/');

/** Sets up WordPress vars and included files. */
require_once(ABSPATH . 'wp-settings.php');
