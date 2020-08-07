using System;
using System.Linq;
using System.Collections.Generic;
using System.Text;
using System.IO;
using Newtonsoft.Json;
namespace PowerOnCartographer
{
    class HtmlRender
    {
        public static string BasePath = Path.GetDirectoryName(System.Reflection.Assembly.GetExecutingAssembly().Location);
        public static string BaseHtml { get { return File.ReadAllText(@"C:\UFCU\PowerOnCartographer\PowerOnCartographer" + "\\assets\\D3JsTree1.html"); } }

        //C:\UFCU\PowerOnCartographer\PowerOnCartographer\assets\D3JsTree1.html

        public string DependencyTree { get; set; }
        public string DependentTree { get; set; }
        public string dropdownContents { get; set; }
        public HtmlRender()
        {
            string check = BaseHtml;
        }

        public HtmlRender(PowerOnCrawler crawler)
        {

            DependencyTree = "var dependency_file_tree = [" + string.Join(",", crawler.RootFiles.Select(x => JsonConvert.SerializeObject(x))) + "];";
            dropdownContents = "";
            for (int i = 0; i < crawler.RootFiles.Count; i++)
            {
                dropdownContents += "<option value=\"" + i + "\">" + crawler.RootFiles[i].name + "</option>";
            }

            DependentTree = "var dependent_file_tree = [" + string.Join(",", crawler.DependentRootFiles.Select(x => JsonConvert.SerializeObject(x))) + "];";
        }

        public void RenderChartJs(string path)
        {
            string fillString = BaseHtml.Replace("!@#Fill!@#", DependencyTree);
            fillString = fillString.Replace("!@#DependentFill!@#", DependentTree);
            fillString = fillString.Replace("!@#DROPDOWN!@#", dropdownContents);

            File.WriteAllText(BasePath + "\\" + path, fillString);


        }
    }
}
