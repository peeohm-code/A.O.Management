import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CheckCircle2, ClipboardCheck, BarChart3, ArrowRight } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <div className="container py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              ยินดีต้อนรับ, {user.name || "ผู้ใช้"}
            </h1>
            <p className="text-xl text-muted-foreground">
              เริ่มต้นจัดการโครงการก่อสร้างของคุณ
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Building2 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>จัดการโครงการ</CardTitle>
                <CardDescription>
                  สร้างและติดตามโครงการก่อสร้างทั้งหมดในที่เดียว
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/projects">
                  <Button className="w-full">
                    เริ่มต้น
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CheckCircle2 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>จัดการงาน</CardTitle>
                <CardDescription>
                  มอบหมายและติดตามสถานะงานในแต่ละโครงการ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/projects">
                  <Button className="w-full" variant="outline">
                    ดูงานทั้งหมด
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <ClipboardCheck className="h-10 w-10 text-primary mb-2" />
                <CardTitle>ตรวจสอบคุณภาพ</CardTitle>
                <CardDescription>
                  สร้างและบันทึกผลการตรวจสอบคุณภาพงานก่อสร้าง
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/projects">
                  <Button className="w-full" variant="outline">
                    ดู QC Checklist
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-8 text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">ติดตามความคืบหน้า</h2>
              <p className="text-primary-foreground/90 mb-4">
                ดูภาพรวมและรายงานสรุปโครงการทั้งหมดของคุณ
              </p>
              <Link href="/projects">
                <Button variant="secondary" size="lg">
                  ไปที่แดชบอร์ด
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">{APP_TITLE}</h1>
          <p className="text-xl text-muted-foreground mb-8">
            ระบบจัดการงานก่อสร้างและควบคุมคุณภาพแบบครบวงจร
          </p>
          <Button size="lg" onClick={() => window.location.href = getLoginUrl()}>
            เข้าสู่ระบบ
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <div className="grid gap-8 md:grid-cols-3 mb-16">
          <Card>
            <CardHeader>
              <Building2 className="h-12 w-12 text-primary mb-4" />
              <CardTitle>จัดการโครงการ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                สร้างและติดตามโครงการก่อสร้างทั้งหมด พร้อมข้อมูลรายละเอียดครบถ้วน
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <ClipboardCheck className="h-12 w-12 text-primary mb-4" />
              <CardTitle>ควบคุมคุณภาพ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                สร้าง QC Checklist และบันทึกผลการตรวจสอบพร้อมรูปภาพประกอบ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-primary mb-4" />
              <CardTitle>รายงานและวิเคราะห์</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                ดูภาพรวมและสถิติโครงการ พร้อมรายงานสรุปที่ครบถ้วน
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">พร้อมเริ่มต้นแล้วหรือยัง?</h2>
            <p className="text-muted-foreground mb-6">
              เข้าสู่ระบบเพื่อเริ่มจัดการโครงการก่อสร้างของคุณ
            </p>
            <Button size="lg" onClick={() => window.location.href = getLoginUrl()}>
              เข้าสู่ระบบ
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
