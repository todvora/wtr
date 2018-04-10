<?php
/*
 * http://service.salzburg.gv.at/ogd/client/showDetail/bad388c1-e13f-484d-ba51-331a79537f5f
 */

function get_web_page($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_VERBOSE, 1);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 6.1; rv:8.0) Gecko/20100101 Firefox/8.0");
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
    $response = curl_exec($ch);
    if ($response === FALSE) {
        printf("cUrl error (#%d): %s<br>\n", curl_errno($ch), htmlspecialchars(curl_error($ch)));
    }
    curl_close($ch);
    return $response;
}

$jsonp_callback = $_GET['callback'];
$data = utf8_encode(get_web_page("https://www.salzburg.gv.at/ogd/bad388c1-e13f-484d-ba51-331a79537f5f/meteorologie-aktuell.csv"));
$lines = explode("\n", $data);

$headers = str_getcsv(array_shift($lines), ";"); // currently ignored

$results = array();
foreach ($lines as $line) {
    $row = str_getcsv($line, ";");
    $place = $row[0];
    $param = preg_replace("/[[:blank:]]+/"," ",$row[1]);
    $time = $row[2];
    $value = $row[3];
    if (trim($place) !== "" && $value !== "?" && $value !== "-" && $value !== 'Dfue') { // ignore unknown values
        if (!$results[$place]) {
            $results[$place] = array();
        }
        if (!$results[$place][$param]) {
            $results[$place][$param] = array();
        }
        $results[$place][$param][$time] = $value;
    }
}

$json = json_encode($results);


header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

if ($jsonp_callback) {
    header('Content-Type: application/javascript; charset=utf-8');
    print "$jsonp_callback($json)";
} else {
    header('Content-Type: application/json; charset=utf-8');
    print $json;
}