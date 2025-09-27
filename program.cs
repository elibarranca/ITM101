class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("Hello, World!");

        List<int> myList = new List<int>();
        myList.Add(10);
        myList.Add(20);
        myList.Add(30);

        int count = myList.Count();   //Now count is my variable

        Console.WriteLine($"The count is: {count}");

        int total = 0;

        /*
        for (int i = 0; i < count; i++)
        {
            total += myList[i];
        }
        */

        foreach (int number in myList)
        {
            total += number;
        }

        Console.WriteLine($"The total is: {total}");

        int avg = total / count;
        Console.WriteLine($"Avg is: {avg}");--

    }
}