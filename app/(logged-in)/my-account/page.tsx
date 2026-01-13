import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default async function MyAccount() {
  const session = await auth();

  return (
    <Card className="w-[400] ">
      <CardHeader>
        <CardTitle className="text-center font-bold size-1.2">My Account</CardTitle>
      </CardHeader>
      <CardContent>
        <Label>
          Email Address
        </Label>
        <div className="text-muted-foreground">
          { session?.user?.email }
        </div>
      </CardContent>
    </Card>
  )
}