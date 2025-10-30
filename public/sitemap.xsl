<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
                xmlns:html="http://www.w3.org/1999/xhtml"
                xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title>XML Sitemap</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <style type="text/css">
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
          }
          h1 {
            font-size: 2em;
            margin: 0 0 10px;
            color: #2271b1;
          }
          .intro {
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .intro p {
            margin: 10px 0;
            line-height: 1.6;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          th {
            background: #2271b1;
            color: #fff;
            padding: 12px;
            text-align: left;
            font-weight: 600;
          }
          tr:nth-child(even) {
            background: #f9f9f9;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #e5e5e5;
          }
          td a {
            color: #2271b1;
            text-decoration: none;
          }
          td a:hover {
            text-decoration: underline;
          }
          .priority {
            text-align: center;
          }
          .changefreq {
            text-align: center;
            text-transform: capitalize;
          }
          .footer {
            margin-top: 20px;
            padding: 20px;
            background: #fff;
            border-radius: 8px;
            text-align: center;
            color: #666;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
        </style>
      </head>
      <body>
        <div class="intro">
          <h1>XML Sitemap</h1>
          <p>Đây là sitemap XML được tạo tự động cho các công cụ tìm kiếm như Google, Bing, Yahoo.</p>
          <p>Bạn có thể tìm hiểu thêm về <a href="https://www.sitemaps.org/">XML sitemaps tại sitemaps.org</a>.</p>
          <p><strong>Tổng số URLs:</strong> <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></p>
        </div>

        <xsl:choose>
          <!-- Sitemap Index -->
          <xsl:when test="sitemap:sitemapindex">
            <table>
              <thead>
                <tr>
                  <th>Sitemap</th>
                  <th>Last Modified</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
                  <tr>
                    <td>
                      <a href="{sitemap:loc}">
                        <xsl:value-of select="sitemap:loc"/>
                      </a>
                    </td>
                    <td>
                      <xsl:value-of select="sitemap:lastmod"/>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </xsl:when>

          <!-- URL Set -->
          <xsl:otherwise>
            <table>
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Last Modified</th>
                  <th class="changefreq">Change Frequency</th>
                  <th class="priority">Priority</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                  <tr>
                    <td>
                      <a href="{sitemap:loc}">
                        <xsl:value-of select="sitemap:loc"/>
                      </a>
                    </td>
                    <td>
                      <xsl:value-of select="sitemap:lastmod"/>
                    </td>
                    <td class="changefreq">
                      <xsl:value-of select="sitemap:changefreq"/>
                    </td>
                    <td class="priority">
                      <xsl:value-of select="sitemap:priority"/>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </xsl:otherwise>
        </xsl:choose>

        <div class="footer">
          <p>Generated by Next.js Sitemap | Powered by Vercel</p>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

